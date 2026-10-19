import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients } from '@/lib/postgres/patient-service';
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
