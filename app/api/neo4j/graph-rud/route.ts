import { NextRequest, NextResponse } from 'next/server';
import {
  getDrugStarNetwork,
  createGraphInteraction,
  updateGraphInteraction,
  deleteGraphInteraction,
  getGraphOverview,
} from '@/lib/neo4j/graph-rud-service';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Bundles SHOW CONSTRAINTS, node/edge counts, degree centrality ranking,
    // and the full curated demo graph — everything section 4 and 9D of the
    // viva guide otherwise require opening Neo4j Browser for.
    if (action === 'overview') {
      const overview = await getGraphOverview();
      return NextResponse.json({ success: true, overview });
    }

    const drug = searchParams.get('drug') || 'warfarin';

    const starNetwork = await getDrugStarNetwork(drug);
    if (!starNetwork) {
      return NextResponse.json({
        success: false,
        error: `Drug "${drug}" not found in Neo4j knowledge graph.`,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      starNetwork,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { drugA, drugB, severity, mechanism } = body || {};

    if (!drugA || !drugB) {
      return NextResponse.json(
        { success: false, error: 'Both drugA and drugB are required to create interaction edge.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    await createGraphInteraction(drugA, drugB, severity, mechanism);
    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      executionMs,
      message: `Created/Merged [:INTERACTS_WITH] edge in Neo4j graph: (${drugA}) <-> (${drugB}).`,
    }, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { drugA, drugB, severity, mechanism } = body || {};

    if (!drugA || !drugB || !severity) {
      return NextResponse.json(
        { success: false, error: 'drugA, drugB, and severity are required.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const ok = await updateGraphInteraction(drugA, drugB, severity, mechanism);
    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: ok,
      executionMs,
      message: ok
        ? `Updated Neo4j edge properties for (${drugA}) <-> (${drugB}).`
        : `Edge between (${drugA}) and (${drugB}) was not found in Neo4j.`,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const drugA = searchParams.get('drug_a');
    const drugB = searchParams.get('drug_b');

    if (!drugA || !drugB) {
      return NextResponse.json(
        { success: false, error: 'Both drug_a and drug_b are required.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const ok = await deleteGraphInteraction(drugA, drugB);
    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: ok,
      executionMs,
      message: ok
        ? `Deleted Neo4j [:INTERACTS_WITH] edge between (${drugA}) and (${drugB}).`
        : 'Interaction edge not found in Neo4j graph.',
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
