import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { patientName, patientId, doctorUsername, notes } = body || {};

    const targetPatientName = (patientName || (isNaN(Number(patientId)) ? String(patientId) : '') || '').trim();
    const clinician = doctorUsername?.trim() || 'dr_sharma';
    const auditNotes = notes?.trim() || 'Direct screening run via DBMS Evaluation Studio';

    if (!targetPatientName && !patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient Full Name is required.' },
        { status: 400 }
      );
    }

    // Lookup patient by full_name (with patientId fallback)
    let patientRow: any = null;
    if (targetPatientName) {
      const pCheck = await query(
        `SELECT patient_id, full_name, mrn FROM patients WHERE LOWER(full_name) = LOWER($1);`,
        [targetPatientName],
        'DOCTOR'
      );
      if (pCheck.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Patient with full_name "${targetPatientName}" does not exist. Pick a valid patient from the cohort (e.g. Robert Vance, Sarah Connor, James Wilson, Diana Prince).`,
          },
          { status: 404 }
        );
      }
      patientRow = pCheck.rows[0];
    } else {
      const pCheck = await query(
        `SELECT patient_id, full_name, mrn FROM patients WHERE patient_id = $1;`,
        [parseInt(patientId, 10)],
        'DOCTOR'
      );
      if (pCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: `Patient #${patientId} does not exist.` },
          { status: 404 }
        );
      }
      patientRow = pCheck.rows[0];
    }

    const startTime = Date.now();

    // Call stored PL/pgSQL function fn_perform_patient_direct_screening using full_name
    const res = await query(
      `SELECT * FROM fn_perform_patient_direct_screening($1::VARCHAR, $2, $3);`,
      [patientRow.full_name, clinician, auditNotes],
      'DOCTOR'
    );

    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      functionName: 'fn_perform_patient_direct_screening(p_patient_name, p_doctor_username, p_notes)',
      patientName: patientRow.full_name,
      patientId: patientRow.patient_id,
      mrn: patientRow.mrn,
      clinician,
      auditNotes,
      executionMs,
      rowsReturned: res.rows.length,
      data: res.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
