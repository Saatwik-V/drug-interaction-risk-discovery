import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { testType } = body || {};

    const startTime = Date.now();
    try {
      if (testType === 'PATIENT_SYNTHETIC') {
        // Violate CHECK (is_synthetic = TRUE)
        await query(
          `INSERT INTO patients (mrn, full_name, gender, date_of_birth, is_synthetic)
           VALUES ('REAL-PAT-9999', 'Real Human Test', 'Male', '1985-05-12', FALSE);`,
          [],
          'ADMIN'
        );
      } else if (testType === 'HOP_DEPTH') {
        // Violate CHECK (max_hop_depth BETWEEN 1 AND 3)
        await query(
          `INSERT INTO risk_assessments (patient_id, performed_by, max_hop_depth, total_active_medications)
           VALUES (1, 'dr_test', 5, 2);`,
          [],
          'ADMIN'
        );
      } else if (testType === 'PAIR_ORDER') {
        // Violate CHECK (drug_a_id < drug_b_id)
        await query(
          `INSERT INTO ddi_pairs (drug_a_id, drug_b_id)
           VALUES (5, 1);`,
          [],
          'ADMIN'
        );
      } else {
        return NextResponse.json({ success: false, error: 'Unknown check test type.' }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        message: 'Unexpected: Query succeeded without triggering CHECK constraint.',
      });
    } catch (dbErr: any) {
      const executionMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        enforced: true,
        constraintType: 'CHECK CONSTRAINT',
        errorCode: dbErr.code, // 23514
        constraint: dbErr.constraint,
        table: dbErr.table,
        errorMessage: dbErr.message,
        executionMs,
        demonstrationSummary:
          `PostgreSQL engine enforced CHECK constraint "${dbErr.constraint}" with SQLState ${dbErr.code}. ` +
          `Database rejected row insertion protecting data domain invariant.`,
      });
    }
  } catch (error: any) {
    return handleAuthError(error);
  }
}
