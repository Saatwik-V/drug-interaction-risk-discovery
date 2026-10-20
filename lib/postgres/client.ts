import { Pool, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

let defaultPool: Pool | null = null;
let doctorPool: Pool | null = null;
let adminPool: Pool | null = null;

export type DatabaseRole = 'DOCTOR' | 'ADMIN' | 'DEFAULT';

/**
 * Returns a connection pool configured for the specified least-privilege database role.
 * - DOCTOR: Connects as app_doctor_user (restricted from user_accounts and clinical deletions).
 * - ADMIN: Connects as app_admin_user (full administrative authority).
 * - DEFAULT: Connects using standard application credentials (fallback).
 */
export function getPostgresPool(role: DatabaseRole = 'DEFAULT'): Pool {
  if (role === 'DOCTOR') {
    if (!doctorPool) {
      const connStr = process.env.DOCTOR_DATABASE_URL || process.env.DATABASE_URL;
      doctorPool = new Pool({
        connectionString: connStr || undefined,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'drug_interaction_db',
        user: process.env.DOCTOR_PGUSER || 'app_doctor_user',
        password: process.env.DOCTOR_PGPASSWORD || 'DoctorPass#2026',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      doctorPool.on('error', (err) => {
        console.error('Unexpected error on idle Doctor PostgreSQL client:', err);
      });
    }
    return doctorPool;
  }

  if (role === 'ADMIN') {
    if (!adminPool) {
      const connStr = process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL;
      adminPool = new Pool({
        connectionString: connStr || undefined,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'drug_interaction_db',
        user: process.env.ADMIN_PGUSER || 'app_admin_user',
        password: process.env.ADMIN_PGPASSWORD || 'AdminPass#2026',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      adminPool.on('error', (err) => {
        console.error('Unexpected error on idle Admin PostgreSQL client:', err);
      });
    }
    return adminPool;
  }

  if (!defaultPool) {
    const connectionString = process.env.DATABASE_URL;
    defaultPool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'drug_interaction_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    defaultPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return defaultPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  role: DatabaseRole = 'DEFAULT'
): Promise<QueryResult<T>> {
  const p = getPostgresPool(role);
  return p.query<T>(text, params);
}

export async function closePostgresPool(): Promise<void> {
  if (defaultPool) {
    await defaultPool.end();
    defaultPool = null;
  }
  if (doctorPool) {
    await doctorPool.end();
    doctorPool = null;
  }
  if (adminPool) {
    await adminPool.end();
    adminPool = null;
  }
}
