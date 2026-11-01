import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients, createPatient } from '@/lib/postgres/patient-service';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Both Doctor and Admin are authorized to access the patient registry
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const patients = await getAllPatients();
    return NextResponse.json({
      success: true,
      data: patients,
      count: patients.length,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Adding synthetic patient requires authenticated Doctor or Admin
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { fullName, mrn, gender, dateOfBirth, primaryCondition } = body || {};

    if (!fullName || !mrn || !gender || !dateOfBirth) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, mrn, gender, dateOfBirth.' },
        { status: 400 }
      );
    }

    const patient = await createPatient({
      fullName,
      mrn,
      gender,
      dateOfBirth,
      primaryCondition,
    });

    return NextResponse.json(
      { success: true, data: patient, message: 'Synthetic patient record created in PostgreSQL.' },
      { status: 201 }
    );
  } catch (error: any) {
    // Capture PostgreSQL CHECK constraint or UNIQUE MRN constraint errors
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create patient record.',
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
      },
      { status: 400 }
    );
  }
}
