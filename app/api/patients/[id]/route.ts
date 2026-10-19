import { NextRequest, NextResponse } from 'next/server';
import {
  getPatientById,
  getActivePrescriptions,
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
