import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { patientId, doctorUsername, notes } = body || {};

    const targetPatientId = parseInt(patientId || '1', 10);
    const clinician = doctorUsername?.trim() || 'dr_sharma';
    const auditNotes = notes?.trim() || 'Direct screening run via DBMS Evaluation Studio';

    const startTime = Date.now();

    // Call stored PL/pgSQL function fn_perform_patient_direct_screening
    const res = await query(
      `SELECT * FROM fn_perform_patient_direct_screening($1, $2, $3);`,
      [targetPatientId, clinician, auditNotes],
      'DOCTOR'
    );

    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      functionName: 'fn_perform_patient_direct_screening(p_patient_id, p_doctor_username, p_notes)',
      patientId: targetPatientId,
      clinician,
      executionMs,
      rowsReturned: res.rows.length,
      data: res.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
