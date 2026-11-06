import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients, createPatient, deletePatientByName } from '@/lib/postgres/patient-service';
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
    const session = await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { fullName, mrn, gender, dateOfBirth, primaryCondition } = body || {};

    if (!fullName || !mrn || !gender || !dateOfBirth) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, mrn, gender, dateOfBirth.' },
        { status: 400 }
      );
    }

    // Writes through the DB pool matching the caller's actual session role
    // (app_doctor_user / app_admin_user), not a hardcoded admin connection —
    // otherwise role_doctor's lack of INSERT on `patients` would never
    // actually be exercised, and a compromised DOCTOR session would have
    // silent admin-level DB access regardless of the app-level role check.
    const patient = await createPatient(
      {
        fullName,
        mrn,
        gender,
        dateOfBirth,
        primaryCondition,
      },
      session.role
    );

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

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const fullName = searchParams.get('full_name')?.trim();

    if (!fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing full_name parameter.' },
        { status: 400 }
      );
    }

    const deleted = await deletePatientByName(fullName);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Patient with full_name "${fullName}" not found or already deleted.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Patient "${fullName}" deleted with foreign key CASCADE to prescriptions and assessments.`,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
