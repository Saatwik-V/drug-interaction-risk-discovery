import { NextRequest, NextResponse } from 'next/server';
import {
  getPatientById,
  getActivePrescriptions,
  updatePatient,
  deletePatient,
} from '@/lib/postgres/patient-service';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Both Doctor and Admin are authorized to view patient records
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const patientId = parseInt(params.id, 10);
    if (isNaN(patientId) || patientId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID format.' },
        { status: 400 }
      );
    }

    const patient = await getPatientById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: `Patient with ID ${patientId} not found.` },
        { status: 404 }
      );
    }

    const activePrescriptions = await getActivePrescriptions(patientId);

    return NextResponse.json({
      success: true,
      data: {
        patient,
        active_prescriptions: activePrescriptions,
        active_medication_count: activePrescriptions.length,
      },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const patientId = parseInt(params.id, 10);
    if (isNaN(patientId) || patientId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID format.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updatePatient(patientId, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Patient #${patientId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Patient #${patientId} demographics updated in PostgreSQL.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update patient record.',
        code: error.code,
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Patient deletion cascades across child tables - requires ADMIN role
    await requireRole(request, ['ADMIN']);

    const patientId = parseInt(params.id, 10);
    if (isNaN(patientId) || patientId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID format.' },
        { status: 400 }
      );
    }

    const deleted = await deletePatient(patientId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Patient #${patientId} not found or already deleted.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Patient #${patientId} deleted with foreign key CASCADE to prescriptions and assessments.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete patient.',
        code: error.code,
        detail: error.detail,
      },
      { status: 400 }
    );
  }
}
