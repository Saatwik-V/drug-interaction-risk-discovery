import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDrugs,
  createPrescription,
  updatePrescriptionDosage,
  discontinuePrescription,
  deletePrescription,
} from '@/lib/postgres/prescription-service';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const drugs = await getAllDrugs();
    return NextResponse.json({
      success: true,
      data: drugs,
      count: drugs.length,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { patientId, drugId, dosage, frequency, startDate } = body || {};

    if (!patientId || !drugId || !dosage || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: patientId, drugId, dosage, frequency.' },
        { status: 400 }
      );
    }

    const prescription = await createPrescription({
      patientId: Number(patientId),
      drugId: Number(drugId),
      dosage,
      frequency,
      prescribedBy: user.username,
      startDate,
    });

    return NextResponse.json(
      {
        success: true,
        data: prescription,
        message: 'Prescription successfully recorded in PostgreSQL.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record prescription.',
        code: error.code,
        constraint: error.constraint,
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const { prescriptionId, dosage, frequency, action } = body || {};

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: 'Missing prescriptionId parameter.' },
        { status: 400 }
      );
    }

    if (action === 'DISCONTINUE') {
      const ok = await discontinuePrescription(Number(prescriptionId));
      return NextResponse.json({
        success: ok,
        message: ok
          ? `Prescription #${prescriptionId} discontinued in PostgreSQL.`
          : 'Prescription not found.',
      });
    }

    if (!dosage) {
      return NextResponse.json(
        { success: false, error: 'Dosage is required for updating prescription.' },
        { status: 400 }
      );
    }

    const updated = await updatePrescriptionDosage(
      Number(prescriptionId),
      dosage,
      frequency
    );

    return NextResponse.json({
      success: !!updated,
      data: updated,
      message: `Prescription #${prescriptionId} dosage updated in PostgreSQL.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update prescription.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const prescriptionId = parseInt(searchParams.get('prescription_id') || '0', 10);

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing prescription_id.' },
        { status: 400 }
      );
    }

    const ok = await deletePrescription(prescriptionId);
    return NextResponse.json({
      success: ok,
      message: ok
        ? `Prescription #${prescriptionId} hard-deleted from PostgreSQL.`
        : 'Prescription not found.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete prescription.' },
      { status: 400 }
    );
  }
}
