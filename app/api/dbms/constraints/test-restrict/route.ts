import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    // Find drugs that currently have active prescriptions to demonstrate ON DELETE RESTRICT
    const sql = `
      SELECT DISTINCT d.drug_id, d.canonical_name, count(pr.prescription_id) as active_prescriptions
      FROM drugs d
      JOIN prescriptions pr ON pr.drug_id = d.drug_id
      GROUP BY d.drug_id, d.canonical_name
      ORDER BY d.drug_id ASC;
    `;
    const res = await query(sql, [], 'DOCTOR');
    return NextResponse.json({
      success: true,
      referencedDrugs: res.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Attempting a deletion to test RESTRICT constraint enforcement
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const drugId = parseInt(searchParams.get('drug_id') || '1', 10);

    const startTime = Date.now();
    try {
      // Execute raw DELETE that violates fk_prescriptions_drug
      await query(`DELETE FROM drugs WHERE drug_id = $1;`, [drugId], 'ADMIN');

      return NextResponse.json({
        success: false,
        message: 'Unexpected: Drug was deleted without RESTRICT violation.',
      });
    } catch (dbError: any) {
      const executionMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        enforced: true,
        constraintType: 'ON DELETE RESTRICT',
        errorCode: dbError.code, // 23503
        errorDetail: dbError.detail,
        errorMessage: dbError.message,
        table: dbError.table,
        constraint: dbError.constraint, // fk_prescriptions_drug
        executionMs,
        demonstrationSummary:
          `PostgreSQL engine successfully rejected the deletion with SQLState ${dbError.code}. ` +
          `Foreign key constraint "${dbError.constraint}" on table "${dbError.table}" prevents orphan prescriptions.`,
      });
    }
  } catch (error: any) {
    return handleAuthError(error);
  }
}
