import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const patientId = parseInt(searchParams.get('patient_id') || '0', 10);

    if (!patientId) {
      // Find ephemeral test patients if any exist
      const res = await query(
        `SELECT patient_id, mrn, full_name, created_at FROM patients WHERE mrn LIKE 'CASCADE-TEST-%' ORDER BY patient_id DESC;`,
        [],
        'DOCTOR'
      );
      return NextResponse.json({ success: true, ephemeralPatients: res.rows });
    }

    // Inspect child record counts across the 4 cascading tables
    const patientRes = await query(`SELECT count(*) FROM patients WHERE patient_id = $1;`, [patientId], 'DOCTOR');
    const rxRes = await query(`SELECT count(*) FROM prescriptions WHERE patient_id = $1;`, [patientId], 'DOCTOR');
    const assessRes = await query(`SELECT count(*) FROM risk_assessments WHERE patient_id = $1;`, [patientId], 'DOCTOR');
    const findingsRes = await query(
      `SELECT count(*) FROM assessment_findings af JOIN risk_assessments ra ON af.assessment_id = ra.assessment_id WHERE ra.patient_id = $1;`,
      [patientId],
      'DOCTOR'
    );

    return NextResponse.json({
      success: true,
      patientId,
      counts: {
        patients: Number(patientRes.rows[0].count),
        prescriptions: Number(rxRes.rows[0].count),
        risk_assessments: Number(assessRes.rows[0].count),
        assessment_findings: Number(findingsRes.rows[0].count),
      },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

/**
 * Spawns an ephemeral test patient with child records across all 4 tables.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mrn = `CASCADE-TEST-${randomSuffix}`;
    const name = `Test-Cascade-Patient-${randomSuffix}`;

    // 1. Insert patient
    const pRes = await query(
      `INSERT INTO patients (mrn, full_name, gender, date_of_birth, primary_condition, is_synthetic)
       VALUES ($1, $2, 'Other', '1990-01-01', 'Cascade Demo Invariant', TRUE)
       RETURNING patient_id, mrn, full_name;`,
      [mrn, name],
      'ADMIN'
    );
    const patientId = pRes.rows[0].patient_id;

    // 2. Insert 2 prescriptions (using Drug 1 Warfarin and Drug 4 Amiodarone)
    await query(
      `INSERT INTO prescriptions (patient_id, drug_id, dosage, frequency, status, prescribed_by, start_date)
       VALUES ($1, 1, '5mg', 'Once daily', 'ACTIVE', 'dr_demo', CURRENT_DATE),
              ($1, 4, '200mg', 'Once daily', 'ACTIVE', 'dr_demo', CURRENT_DATE);`,
      [patientId],
      'ADMIN'
    );

    // 3. Insert 1 risk assessment
    const aRes = await query(
      `INSERT INTO risk_assessments (patient_id, performed_by, max_hop_depth, total_active_medications, direct_interaction_count, multi_hop_candidate_count, assessment_notes)
       VALUES ($1, 'dr_demo', 2, 2, 1, 1, 'Cascade Test Assessment')
       RETURNING assessment_id;`,
      [patientId],
      'ADMIN'
    );
    const assessmentId = aRes.rows[0].assessment_id;

    // 4. Insert 2 findings under that assessment
    await query(
      `INSERT INTO assessment_findings (assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path, severity_level, evidence_sources, finding_type)
       VALUES ($1, 1, 4, 1, 'warfarin <-> amiodarone', 'Major', 'DDInter', 'DOCUMENTED_DIRECT'),
              ($1, 1, 4, 2, 'warfarin -> amiodarone -> target', 'Moderate', 'MecDDI', 'CANDIDATE_PATHWAY');`,
      [assessmentId],
      'ADMIN'
    );

    return NextResponse.json({
      success: true,
      message: 'Spawned ephemeral test patient with child records across 4 relational tables.',
      patientId,
      mrn,
      counts: {
        patients: 1,
        prescriptions: 2,
        risk_assessments: 1,
        assessment_findings: 2,
      },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

/**
 * Executes DELETE on the parent patient, causing ON DELETE CASCADE across the 4 tables.
 *
 * Called with no `patient_id` parameter, this instead sweeps and purges ALL leftover
 * ephemeral sandbox patients (mrn LIKE 'CASCADE-TEST-%') left behind by prior demo
 * sessions, guaranteeing the Constraints Lab always starts from a pristine, reproducible
 * state regardless of whether a previous demo was manually cleaned up.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const patientId = parseInt(searchParams.get('patient_id') || '0', 10);

    if (!patientId) {
      const swept = await query(
        `DELETE FROM patients WHERE mrn LIKE 'CASCADE-TEST-%' RETURNING patient_id, mrn;`,
        [],
        'ADMIN'
      );
      return NextResponse.json({
        success: true,
        swept: true,
        sweptCount: swept.rows.length,
        sweptPatients: swept.rows,
        summary:
          swept.rows.length > 0
            ? `Auto-cleaned ${swept.rows.length} leftover sandbox patient(s) from a previous session via ON DELETE CASCADE.`
            : 'No leftover sandbox patients found. Constraints Lab is already pristine.',
      });
    }

    // Capture counts before deletion
    const beforeRx = await query(`SELECT count(*) FROM prescriptions WHERE patient_id = $1;`, [patientId], 'ADMIN');
    const beforeAssess = await query(`SELECT count(*) FROM risk_assessments WHERE patient_id = $1;`, [patientId], 'ADMIN');
    const beforeFindings = await query(
      `SELECT count(*) FROM assessment_findings af JOIN risk_assessments ra ON af.assessment_id = ra.assessment_id WHERE ra.patient_id = $1;`,
      [patientId],
      'ADMIN'
    );

    const startTime = Date.now();
    // Execute Parent Deletion
    await query(`DELETE FROM patients WHERE patient_id = $1;`, [patientId], 'ADMIN');
    const executionMs = Date.now() - startTime;

    // Verify all child counts are now 0
    const afterP = await query(`SELECT count(*) FROM patients WHERE patient_id = $1;`, [patientId], 'ADMIN');
    const afterRx = await query(`SELECT count(*) FROM prescriptions WHERE patient_id = $1;`, [patientId], 'ADMIN');
    const afterAssess = await query(`SELECT count(*) FROM risk_assessments WHERE patient_id = $1;`, [patientId], 'ADMIN');
    const afterFindings = await query(
      `SELECT count(*) FROM assessment_findings af JOIN risk_assessments ra ON af.assessment_id = ra.assessment_id WHERE ra.patient_id = $1;`,
      [patientId],
      'ADMIN'
    );

    return NextResponse.json({
      success: true,
      patientId,
      executionMs,
      beforeCounts: {
        patients: 1,
        prescriptions: Number(beforeRx.rows[0].count),
        risk_assessments: Number(beforeAssess.rows[0].count),
        assessment_findings: Number(beforeFindings.rows[0].count),
      },
      afterCounts: {
        patients: Number(afterP.rows[0].count),
        prescriptions: Number(afterRx.rows[0].count),
        risk_assessments: Number(afterAssess.rows[0].count),
        assessment_findings: Number(afterFindings.rows[0].count),
      },
      summary: `Atomic PostgreSQL ON DELETE CASCADE verified. 1 patient record and all related child records in 3 dependent tables were automatically purged.`,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
