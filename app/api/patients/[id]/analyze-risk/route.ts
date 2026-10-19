import { NextRequest, NextResponse } from 'next/server';
import { orchestrateRiskAssessment } from '@/lib/risk-analysis/orchestrator';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only authorized clinicians (DOCTOR or ADMIN) can trigger a risk evaluation
    const session = await requireRole(request, ['DOCTOR', 'ADMIN']);

    const patientId = parseInt(params.id, 10);
    if (isNaN(patientId) || patientId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient ID specified.' },
        { status: 400 }
      );
    }

    let notes = 'Routine polypharmacy multi-hop evaluation';

    try {
      const body = await request.json();
      if (body && typeof body.notes === 'string') {
        notes = body.notes.trim() || notes;
      }
    } catch {
      // Body is optional
    }

    // Security Guardrail: Authoring clinician identity is derived strictly from
    // the authenticated session token, preventing user impersonation or elevation.
    const assessmentResult = await orchestrateRiskAssessment(
      patientId,
      session.username,
      notes
    );

    return NextResponse.json({
      success: true,
      data: assessmentResult,
    });
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    if (isNotFound) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    return handleAuthError(error);
  }
}
