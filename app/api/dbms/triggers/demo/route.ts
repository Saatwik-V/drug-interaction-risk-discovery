import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    // Fetch latest or specific assessment header with materialized counters
    const res = await query(
      `SELECT assessment_id, patient_id, performed_by, direct_interaction_count, multi_hop_candidate_count, created_at
       FROM risk_assessments
       ORDER BY assessment_id DESC
       LIMIT 1;`,
      [],
      'DOCTOR'
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No assessment session found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assessment: res.rows[0],
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { assessmentId, findingType } = body || {};

    if (!assessmentId || !findingType) {
      return NextResponse.json(
        { success: false, error: 'Missing assessmentId or findingType.' },
        { status: 400 }
      );
    }

    // 1. Get BEFORE counts directly from risk_assessments
    const beforeRes = await query(
      `SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count 
       FROM risk_assessments WHERE assessment_id = $1;`,
      [assessmentId],
      'DOCTOR'
    );
    const before = beforeRes.rows[0];

    const startTime = Date.now();

    // 2. Insert into assessment_findings, which activates trigger trg_assessment_findings_count
    await query(
      `INSERT INTO assessment_findings (
        assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path, 
        severity_level, evidence_sources, finding_type
       ) VALUES (
        $1, 1, 4, $2, 'warfarin <-> amiodarone (Live Trigger Test)', 
        'Major', 'TriggerEvaluationStudio', $3
       );`,
      [assessmentId, findingType === 'DOCUMENTED_DIRECT' ? 1 : 2, findingType],
      'ADMIN'
    );

    const executionMs = Date.now() - startTime;

    // 3. Get AFTER counts from risk_assessments (updated by trigger fn_update_assessment_counts)
    const afterRes = await query(
      `SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count 
       FROM risk_assessments WHERE assessment_id = $1;`,
      [assessmentId],
      'DOCTOR'
    );
    const after = afterRes.rows[0];

    return NextResponse.json({
      success: true,
      triggerFired: 'trg_assessment_findings_count',
      functionExecuted: 'fn_update_assessment_counts()',
      findingType,
      executionMs,
      beforeCounts: {
        direct: before.direct_interaction_count,
        multiHop: before.multi_hop_candidate_count,
      },
      afterCounts: {
        direct: after.direct_interaction_count,
        multiHop: after.multi_hop_candidate_count,
      },
      summary: `Trigger trg_assessment_findings_count fired on AFTER INSERT. Materialized counter updated atomically in PostgreSQL.`,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
