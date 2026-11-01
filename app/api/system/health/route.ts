import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { runCypher } from '@/lib/neo4j/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startPg = Date.now();
  let pgStatus = 'down';
  let pgLatency = 0;
  let pgError: string | null = null;

  try {
    await query('SELECT 1;');
    pgLatency = Date.now() - startPg;
    pgStatus = 'healthy';
  } catch (err: any) {
    pgError = err.message || 'PostgreSQL connection failed';
  }

  const startNeo = Date.now();
  let neoStatus = 'down';
  let neoLatency = 0;
  let neoError: string | null = null;

  try {
    await runCypher('RETURN 1 AS ping;');
    neoLatency = Date.now() - startNeo;
    neoStatus = 'healthy';
  } catch (err: any) {
    neoError = err.message || 'Neo4j connection failed';
  }

  return NextResponse.json({
    status: pgStatus === 'healthy' && neoStatus === 'healthy' ? 'operational' : 'degraded',
    services: {
      postgres: {
        status: pgStatus,
        port: 5432,
        latencyMs: pgLatency,
        error: pgError,
      },
      neo4j: {
        status: neoStatus,
        boltPort: 7687,
        httpPort: 7474,
        latencyMs: neoLatency,
        error: neoError,
      },
    },
    timestamp: new Date().toISOString(),
  });
}
