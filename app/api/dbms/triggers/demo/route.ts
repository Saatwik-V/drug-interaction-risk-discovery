import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const DEMO_MARKER = 'DBMS_STUDIO_TRIGGER_DEMO';

/**
 * Creates a brand-new, isolated demo assessment session with counters at 0/0,
 * after purging any stale demo sessions left behind by earlier runs. Using a
 * dedicated marker (assessment_notes) keeps this sandbox fully isolated from
 * real clinical assessment sessions (e.g. ones created via the Procedures tab
 * or `/patients/[id]` screening), which the previous implementation risked
 * mutating by always attaching to whichever assessment row was most recent.
 */
async function resetDemoSession(patientId: number) {
  await query(`DELETE FROM risk_assessments WHERE assessment_notes = $1;`, [DEMO_MARKER], 'ADMIN');

  const res = await query(
    `INSERT INTO risk_assessments (
       patient_id, performed_by, max_hop_depth, total_active_medications,
       direct_interaction_count, multi_hop_candidate_count, assessment_notes
     ) VALUES ($1, 'dbms_studio_demo', 1, 0, 0, 0, $2)
     RETURNING assessment_id, patient_id, performed_by, direct_interaction_count, multi_hop_candidate_count, created_at;`,
    [patientId, DEMO_MARKER],
    'ADMIN'
  );
  return res.rows[0];
}

/**
 * GET returns the active sandbox demo session. Pass `?reset=true` to purge any
 * stale session and start a brand-new one at 0/0 — this is also what runs
 * automatically every time the Triggers tab is opened, so the lab is always
 * reproducible no matter what a previous demo (or crashed session) left behind.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const forceReset = searchParams.get('reset') === 'true';

    if (forceReset) {
      const assessment = await resetDemoSession(1);
      return NextResponse.json({ success: true, assessment, wasReset: true });
    }

    const res = await query(
      `SELECT assessment_id, patient_id, performed_by, direct_interaction_count, multi_hop_candidate_count, created_at
       FROM risk_assessments
       WHERE assessment_notes = $1
       ORDER BY assessment_id DESC
       LIMIT 1;`,
      [DEMO_MARKER],
      'DOCTOR'
    );

    if (res.rows.length === 0) {
      const assessment = await resetDemoSession(1);
      return NextResponse.json({ success: true, assessment, wasReset: true });
    }

    return NextResponse.json({
      success: true,
      assessment: res.rows[0],
      wasReset: false,
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

    // Safety net: only allow this trigger sandbox to mutate its own isolated
    // demo session, never a real clinical risk_assessments row.
    const guardRes = await query(
      `SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count, assessment_notes
       FROM risk_assessments WHERE assessment_id = $1;`,
      [assessmentId],
      'DOCTOR'
    );
    const before = guardRes.rows[0];
    if (!before || before.assessment_notes !== DEMO_MARKER) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refusing to mutate a non-sandbox assessment. Reload the Triggers tab to get a fresh demo session.',
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Insert into assessment_findings, which activates trigger trg_assessment_findings_count
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

    // Get AFTER counts from risk_assessments (updated by trigger fn_update_assessment_counts)
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

/**
 * Explicit reset endpoint for the "Reset Demo Session" button — purges the
 * sandbox and creates a fresh one at 0/0 without needing to reload the tab.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);
    const assessment = await resetDemoSession(1);
    return NextResponse.json({ success: true, assessment, wasReset: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
