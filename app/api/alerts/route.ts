import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Both Doctor and Admin roles may inspect alerts and assessment history
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const sql = `
      SELECT 
        ra.assessment_id,
        ra.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        ra.performed_by,
        ra.max_hop_depth,
        ra.total_active_medications,
        ra.direct_interaction_count,
        ra.multi_hop_candidate_count,
        ra.assessment_notes,
        ra.created_at::TEXT,
        COALESCE(
          json_agg(
            json_build_object(
              'finding_id', af.finding_id,
              'drug_a_id', af.drug_a_id,
              'drug_b_id', af.drug_b_id,
              'hop_count', af.hop_count,
              'traversal_path', af.traversal_path,
              'severity_level', af.severity_level,
              'mechanism_category', af.mechanism_category,
              'evidence_sources', af.evidence_sources,
              'finding_type', af.finding_type
            )
          ) FILTER (WHERE af.finding_id IS NOT NULL),
          '[]'::json
        ) AS findings
      FROM risk_assessments ra
      JOIN patients p ON p.patient_id = ra.patient_id
      LEFT JOIN assessment_findings af ON af.assessment_id = ra.assessment_id
      GROUP BY ra.assessment_id, ra.patient_id, p.mrn, p.full_name, ra.performed_by,
               ra.max_hop_depth, ra.total_active_medications, ra.direct_interaction_count,
               ra.multi_hop_candidate_count, ra.assessment_notes, ra.created_at
      ORDER BY ra.created_at DESC
      LIMIT 50;
    `;

    const res = await query(sql);
    return NextResponse.json({
      success: true,
      data: res.rows,
      count: res.rows.length,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
