import { query, getPostgresPool } from './client';

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  constraint_type?: string | null;
}

export interface ConstraintDetail {
  constraint_name: string;
  table_name: string;
  constraint_type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'CHECK' | 'UNIQUE';
  definition: string;
}

export async function getDatabaseTables(): Promise<string[]> {
  const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `;
  const res = await query<{ table_name: string }>(sql, [], 'DEFAULT');
  return res.rows.map((r) => r.table_name);
}

export async function getTableColumns(tableName: string): Promise<TableColumn[]> {
  const sql = `
    SELECT 
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      (
        SELECT tc.constraint_type
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
          AND kcu.table_schema = tc.table_schema
        WHERE kcu.table_schema = 'public'
          AND kcu.table_name = c.table_name
          AND kcu.column_name = c.column_name
        ORDER BY CASE tc.constraint_type
          WHEN 'PRIMARY KEY' THEN 1
          WHEN 'FOREIGN KEY' THEN 2
          WHEN 'UNIQUE' THEN 3
          ELSE 4
        END
        LIMIT 1
      ) AS constraint_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = $1
    ORDER BY c.ordinal_position ASC;
  `;
  const res = await query<TableColumn>(sql, [tableName], 'DEFAULT');
  return res.rows;
}

export async function getAllConstraints(tableName?: string): Promise<ConstraintDetail[]> {
  let sql = `
    SELECT
      con.conname AS constraint_name,
      rel.relname AS table_name,
      CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        WHEN 'u' THEN 'UNIQUE'
        ELSE 'OTHER'
      END AS constraint_type,
      pg_get_constraintdef(con.oid, true) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
  `;
  const params: any[] = [];
  if (tableName) {
    sql += ` AND rel.relname = $1`;
    params.push(tableName);
  }
  sql += ` ORDER BY rel.relname ASC, con.conname ASC;`;

  const res = await query<ConstraintDetail>(sql, params, 'DEFAULT');
  return res.rows;
}

export async function generateCreateTableDdl(tableName: string): Promise<string> {
  const columns = await getTableColumns(tableName);
  const constraints = await getAllConstraints(tableName);

  if (columns.length === 0) {
    throw new Error(`Table "${tableName}" does not exist in public schema.`);
  }

  const lines: string[] = [];

  // Column definitions
  for (const col of columns) {
    let line = `    ${col.column_name} ${col.data_type.toUpperCase()}`;
    if (col.column_default) {
      line += ` DEFAULT ${col.column_default}`;
    }
    if (col.is_nullable === 'NO') {
      line += ' NOT NULL';
    }
    lines.push(line);
  }

  // Constraint definitions
  for (const con of constraints) {
    lines.push(`    CONSTRAINT ${con.constraint_name} ${con.definition}`);
  }

  return `CREATE TABLE ${tableName} (\n${lines.join(',\n')}\n);`;
}
