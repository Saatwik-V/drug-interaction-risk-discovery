import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabaseTables,
  getTableColumns,
  getAllConstraints,
  generateCreateTableDdl,
} from '@/lib/postgres/schema-service';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    const action = searchParams.get('action'); // 'list_tables' | 'columns' | 'constraints' | 'ddl'

    if (!tableName || action === 'list_tables') {
      const tables = await getDatabaseTables();
      const constraints = await getAllConstraints();
      return NextResponse.json({
        success: true,
        tables,
        totalConstraints: constraints.length,
      });
    }

    if (action === 'columns') {
      const columns = await getTableColumns(tableName);
      return NextResponse.json({ success: true, table: tableName, columns });
    }

    if (action === 'constraints') {
      const constraints = await getAllConstraints(tableName);
      return NextResponse.json({ success: true, table: tableName, constraints });
    }

    // Default: Return full schema bundle for table (Columns, Constraints, DDL)
    const columns = await getTableColumns(tableName);
    const constraints = await getAllConstraints(tableName);
    const ddl = await generateCreateTableDdl(tableName);

    return NextResponse.json({
      success: true,
      table: tableName,
      columns,
      constraints,
      ddl,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
