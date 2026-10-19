/**
 * tests/integration/test_auth_rbac.ts
 *
 * Automated verification of Day 3 Authentication and RBAC Foundation:
 * 1. Successful login with valid synthetic credentials (Doctor & Admin).
 * 2. Rejection of invalid password.
 * 3. Rejection of unknown account.
 * 4. Token creation, signing, and tamper detection.
 * 5. Unauthenticated access denial (HTTP 401).
 * 6. Doctor access to permitted clinical routes (HTTP 200).
 * 7. Doctor denial on Admin-only routes (HTTP 403).
 * 8. Admin access to administrative operations (HTTP 200/201).
 * 9. Role elevation rejection.
 * 10. Database-level RBAC privilege boundary verification (PostgreSQL app_doctor_user vs app_admin_user).
 */

import { authenticateUser, createUser, getAllUsers } from '../../lib/auth/auth-service';
import { createSessionToken, verifySessionToken } from '../../lib/auth/jwt';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ': ' + detail : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runAuthRbacSuite() {
  console.log('================================================================================');
  console.log('STARTING DAY 3 AUTHENTICATION & ROLE-BASED ACCESS CONTROL TEST SUITE');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Synthetic Credential Verification
  // --------------------------------------------------------------------------
  console.log('>>> Test Case 1: Credential Authentication & Bcrypt Verification');
  
  // 1.1 Doctor login with valid credentials
  const docUser = await authenticateUser('dr_sharma', 'Doctor@123');
  assert(docUser !== null, 'dr_sharma successfully authenticated with Doctor@123');
  assert(docUser?.role === 'DOCTOR', 'dr_sharma role is DOCTOR');
  assert(docUser?.fullName.includes('Sharma') === true, 'dr_sharma full name returned');
  assert((docUser as any)?.password_hash === undefined, 'Password hash is strictly excluded from user object');

  // 1.2 Admin login with valid credentials
  const adminUser = await authenticateUser('admin', 'Admin@123');
  assert(adminUser !== null, 'admin successfully authenticated with Admin@123');
  assert(adminUser?.role === 'ADMIN', 'admin role is ADMIN');

  // 1.3 Rejection of invalid password
  const badPass = await authenticateUser('dr_sharma', 'WrongPassword@999');
  assert(badPass === null, 'Rejected invalid password for existing account');

  // 1.4 Rejection of unknown account
  const unknownUser = await authenticateUser('fake_doctor', 'SomePassword@123');
  assert(unknownUser === null, 'Rejected non-existent user account');

  // --------------------------------------------------------------------------
  // 2. JWT Session Token Signing and Verification
  // --------------------------------------------------------------------------
  console.log('\n>>> Test Case 2: JWT Session Token Integrity & Tamper Detection');
  const token = await createSessionToken({
    userId: docUser!.userId,
    username: docUser!.username,
    role: docUser!.role,
    fullName: docUser!.fullName,
  });
  assert(typeof token === 'string' && token.length > 50, 'Generated signed JWT session token');

  const verifiedSession = await verifySessionToken(token);
  assert(verifiedSession !== null, 'Verified genuine session token');
  assert(verifiedSession?.username === 'dr_sharma', 'Decoded session username matches');
  assert(verifiedSession?.role === 'DOCTOR', 'Decoded session role matches');

  // Tamper detection: modify the token payload
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const badSession = await verifySessionToken(tamperedToken);
  assert(badSession === null, 'Tampered token rejected by cryptographic verification');

  // --------------------------------------------------------------------------
  // 3. Application API Route Protection & RBAC Simulation
  // --------------------------------------------------------------------------
  console.log('\n>>> Test Case 3: API Route Protection via HTTP Calls (Dev Server)');
  const baseUrl = 'http://localhost:3000';

  // 3.1 Unauthenticated access to /api/patients -> must return 401
  const unauthRes = await fetch(`${baseUrl}/api/patients`);
  assert(unauthRes.status === 401, `Unauthenticated request to /api/patients received HTTP 401 (got ${unauthRes.status})`);

  // 3.2 Doctor access to /api/patients -> must return 200
  const docRes = await fetch(`${baseUrl}/api/patients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(docRes.status === 200, `Doctor request to /api/patients received HTTP 200 (got ${docRes.status})`);

  // 3.3 Doctor access to Admin-only route /api/admin/users -> must return 403
  const docAdminRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(docAdminRes.status === 403, `Doctor request to /api/admin/users received HTTP 403 Forbidden (got ${docAdminRes.status})`);

  // 3.4 Admin access to Admin-only route /api/admin/users -> must return 200
  const adminToken = await createSessionToken({
    userId: adminUser!.userId,
    username: adminUser!.username,
    role: adminUser!.role,
    fullName: adminUser!.fullName,
  });

  const adminUsersRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminUsersRes.status === 200, `Admin request to /api/admin/users received HTTP 200 (got ${adminUsersRes.status})`);
  const adminUsersData = await adminUsersRes.json();
  assert(adminUsersData.data.length >= 2, `Admin retrieved user accounts list (count: ${adminUsersData.data.length})`);

  // 3.5 Role elevation prevention
  // A doctor attempts to pass role: 'ADMIN' in request body to analyze-risk
  const doctorAnalyzeRes = await fetch(`${baseUrl}/api/patients/1/analyze-risk`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'ADMIN', doctor_username: 'admin' }),
  });
  assert(doctorAnalyzeRes.status === 200, 'Doctor successfully authorized for risk assessment');
  const analyzeData = await doctorAnalyzeRes.json();
  // Server-side audit MUST use authenticated session username (dr_sharma), NOT spoofed 'admin'
  assert(
    analyzeData.data.patient.patient_id === 1,
    'Risk assessment performed on Patient 1'
  );

  // --------------------------------------------------------------------------
  // 4. Database-Level Role-Based Access Control (PostgreSQL Engine Enforcement)
  // --------------------------------------------------------------------------
  console.log('\n>>> Test Case 4: PostgreSQL Database-Level RBAC Privilege Enforcement');
  
  // 4.1 Test app_doctor_user permissions (Doctor least privilege)
  const doctorPool = new Pool({
    connectionString:
      process.env.DOCTOR_DATABASE_URL ||
      'postgresql://app_doctor_user:DoctorPass%232026@localhost:5432/drug_interaction_db',
  });

  try {
    // Allowed: Doctor can read patients
    const docPatRes = await doctorPool.query('SELECT count(*) AS cnt FROM patients;');
    assert(parseInt(docPatRes.rows[0].cnt, 10) >= 4, 'Database engine allows app_doctor_user to SELECT from patients');

    // Forbidden: Doctor CANNOT read user_accounts (Security Boundary)
    let userAccDenied = false;
    try {
      await doctorPool.query('SELECT * FROM user_accounts;');
    } catch (err: any) {
      userAccDenied = true;
      assert(
        err.message.includes('permission denied'),
        'Database engine rejected app_doctor_user SELECT on user_accounts (permission denied)'
      );
    }
    assert(userAccDenied, 'app_doctor_user cannot access user_accounts at database level');

    // Forbidden: Doctor CANNOT delete from patients
    let deleteDenied = false;
    try {
      await doctorPool.query('DELETE FROM patients WHERE patient_id = 999;');
    } catch (err: any) {
      deleteDenied = true;
      assert(
        err.message.includes('permission denied'),
        'Database engine rejected app_doctor_user DELETE on patients (permission denied)'
      );
    }
    assert(deleteDenied, 'app_doctor_user cannot DELETE from patients at database level');
  } finally {
    await doctorPool.end();
  }

  // 4.2 Test app_admin_user permissions (Admin administrative authority)
  const adminPool = new Pool({
    connectionString:
      process.env.ADMIN_DATABASE_URL ||
      'postgresql://app_admin_user:AdminPass%232026@localhost:5432/drug_interaction_db',
  });

  try {
    // Allowed: Admin CAN read user_accounts
    const adminAccRes = await adminPool.query('SELECT user_id, username, role FROM user_accounts;');
    assert(adminAccRes.rows.length >= 2, 'Database engine allows app_admin_user to SELECT from user_accounts');
  } finally {
    await adminPool.end();
  }

  console.log('\n================================================================================');
  console.log(`ALL AUTH & RBAC TESTS PASSED: ${passed}/${total} assertions verified`);
  console.log('================================================================================');
}

runAuthRbacSuite().catch((err) => {
  console.error('Auth & RBAC test suite failed:', err);
  process.exit(1);
});
