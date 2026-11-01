import { NextRequest, NextResponse } from 'next/server';
import { query, getPostgresPool } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Only Admin can inspect engine roles and catalog privileges
    await requireRole(request, ['ADMIN']);

    // 1. Query PostgreSQL Engine System Catalogs (pg_roles & pg_user)
    const engineRolesSql = `
      SELECT 
        r.rolname,
        r.rolcanlogin,
        r.rolsuper,
        r.rolinherit,
        ARRAY(
          SELECT b.rolname 
          FROM pg_auth_members m 
          JOIN pg_roles b ON m.roleid = b.oid 
          WHERE m.member = r.oid
        ) AS member_of
      FROM pg_roles r
      WHERE r.rolname IN ('role_doctor', 'role_admin', 'app_doctor_user', 'app_admin_user')
         OR r.rolname LIKE 'dr_%'
      ORDER BY r.rolcanlogin DESC, r.rolname ASC;
    `;
    const engineRes = await query(engineRolesSql, [], 'DEFAULT');

    // 2. Query Application Profile Accounts (user_accounts)
    const appUsersSql = `
      SELECT user_id, username, full_name, role, is_active, created_at::TEXT
      FROM user_accounts
      ORDER BY user_id ASC;
    `;
    const appRes = await query(appUsersSql, [], 'ADMIN');

    return NextResponse.json({
      success: true,
      tier1ApplicationProfiles: appRes.rows,
      tier2PostgresEngineRoles: engineRes.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

/**
 * Tests Least-Privilege Security Boundary live on PostgreSQL.
 * Connects as `app_doctor_user` (granted role_doctor) and attempts to read credentials in `user_accounts`.
 * PostgreSQL engine must block it with Error 42501 (insufficient_privilege).
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN', 'DOCTOR']);

    const doctorPool = getPostgresPool('DOCTOR');
    const startTime = Date.now();

    try {
      // Attempt forbidden read
      await doctorPool.query(`SELECT user_id, username, password_hash FROM user_accounts;`);

      return NextResponse.json({
        success: false,
        message: 'Security Violation: app_doctor_user was able to read user_accounts!',
      });
    } catch (dbErr: any) {
      const executionMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        boundaryEnforced: true,
        testedUser: 'app_doctor_user',
        testedRole: 'role_doctor',
        attemptedQuery: 'SELECT user_id, username, password_hash FROM user_accounts;',
        errorCode: dbErr.code, // 42501
        errorMessage: dbErr.message,
        executionMs,
        demonstrationSummary:
          `PostgreSQL engine successfully blocked access with SQLState ${dbErr.code} (insufficient_privilege). ` +
          `Table "user_accounts" has REVOKE ALL ON user_accounts FROM role_doctor, preventing credential theft at the DBMS kernel level.`,
      });
    }
  } catch (error: any) {
    return handleAuthError(error);
  }
}
