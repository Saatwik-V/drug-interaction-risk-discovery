import { runCypher } from './client';

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  drug_id?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  severity?: string;
  mechanism?: string;
}

export interface StarNetwork {
  center: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphConstraint {
  name: string;
  type: string;
  entityType: string;
  labelsOrTypes: string[];
  properties: string[];
}

export interface CentralityRow {
  drug: string;
  degreeCentrality: number;
}

export interface GraphOverview {
  nodeCount: number;
  edgeCount: number;
  constraints: GraphConstraint[];
  centrality: CentralityRow[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Bundles the Neo4j-native checks a rubric examiner would otherwise run by
 * hand in Neo4j Browser (SHOW CONSTRAINTS, node/edge counts, degree
 * centrality ranking) plus the full curated demo graph for rendering, all
 * in one read so the Studio's "NoSQL Graph RUD" tab can show every one of
 * them from the app itself.
 */
export async function getGraphOverview(): Promise<GraphOverview> {
  const [constraintRows, countRows, centralityRows, fullGraphRows] = await Promise.all([
    runCypher<{
      name: string;
      type: string;
      entityType: string;
      labelsOrTypes: string[];
      properties: string[];
    }>('SHOW CONSTRAINTS YIELD name, type, entityType, labelsOrTypes, properties RETURN name, type, entityType, labelsOrTypes, properties;'),
    runCypher<{ nodeCount: { low: number } | number; edgeCount: { low: number } | number }>(
      'MATCH (d:Drug) WITH count(d) AS nodeCount MATCH ()-[r:INTERACTS_WITH]->() RETURN nodeCount, count(r) AS edgeCount;'
    ),
    runCypher<{ drug: string; degreeCentrality: { low: number } | number }>(
      `MATCH (d:Drug)-[r:INTERACTS_WITH]-()
       RETURN d.canonical_name AS drug, count(r) AS degreeCentrality
       ORDER BY degreeCentrality DESC
       LIMIT 5;`
    ),
    runCypher<{
      a: { properties: { canonical_name: string; drug_id?: any } };
      b: { properties: { canonical_name: string; drug_id?: any } };
      r: { properties: { severity_level?: string; mechanism_categories?: string[] } };
    }>(
      `MATCH (a:Drug)-[r:INTERACTS_WITH]->(b:Drug) RETURN a, r, b ORDER BY a.canonical_name;`
    ),
  ]);

  const toNum = (val: { low: number } | number): number =>
    typeof val === 'object' && val !== null ? val.low : val;

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  for (const row of fullGraphRows) {
    const aProp = row.a.properties;
    const bProp = row.b.properties;
    if (!nodeMap.has(aProp.canonical_name)) {
      nodeMap.set(aProp.canonical_name, {
        id: aProp.canonical_name,
        name: aProp.canonical_name,
        type: 'Drug',
        drug_id: aProp.drug_id ? Number(aProp.drug_id) : undefined,
      });
    }
    if (!nodeMap.has(bProp.canonical_name)) {
      nodeMap.set(bProp.canonical_name, {
        id: bProp.canonical_name,
        name: bProp.canonical_name,
        type: 'Drug',
        drug_id: bProp.drug_id ? Number(bProp.drug_id) : undefined,
      });
    }
    edges.push({
      id: `${aProp.canonical_name}-${bProp.canonical_name}`,
      source: aProp.canonical_name,
      target: bProp.canonical_name,
      type: 'INTERACTS_WITH',
      severity: row.r.properties?.severity_level || 'Unknown',
      mechanism: row.r.properties?.mechanism_categories?.join('; ') || 'General interaction',
    });
  }

  return {
    nodeCount: countRows[0] ? toNum(countRows[0].nodeCount) : 0,
    edgeCount: countRows[0] ? toNum(countRows[0].edgeCount) : 0,
    constraints: constraintRows,
    centrality: centralityRows.map((c) => ({ drug: c.drug, degreeCentrality: toNum(c.degreeCentrality) })),
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

/**
 * READ (R): Retrieves the 1-hop star ego-network for a given drug.
 */
export async function getDrugStarNetwork(drugName: string): Promise<StarNetwork | null> {
  const cypher = `
    MATCH (d:Drug)
    WHERE toLower(d.canonical_name) = toLower($drugName)
    OPTIONAL MATCH (d)-[r:INTERACTS_WITH]-(other:Drug)
    RETURN d, collect({ rel: r, neighbor: other }) AS connections
  `;
  const records = await runCypher<{
    d: { properties: { canonical_name: string; drug_id?: any; therapeutic_class?: string } };
    connections: Array<{
      rel: { properties: { severity_level?: string; mechanism_categories?: string[] } };
      neighbor: { properties: { canonical_name: string; drug_id?: any; therapeutic_class?: string } };
    }>;
  }>(cypher, { drugName: drugName.trim() });

  if (records.length === 0 || !records[0].d) {
    return null;
  }

  const centerProp = records[0].d.properties;
  const centerNode: GraphNode = {
    id: centerProp.canonical_name,
    name: centerProp.canonical_name,
    type: 'CenterDrug',
    drug_id: centerProp.drug_id ? Number(centerProp.drug_id) : undefined,
  };

  const nodes: GraphNode[] = [centerNode];
  const edges: GraphEdge[] = [];
  const seenNodes = new Set<string>([centerProp.canonical_name]);

  for (const conn of records[0].connections || []) {
    if (!conn.neighbor) continue;
    const nProp = conn.neighbor.properties;
    if (!seenNodes.has(nProp.canonical_name)) {
      seenNodes.add(nProp.canonical_name);
      nodes.push({
        id: nProp.canonical_name,
        name: nProp.canonical_name,
        type: 'InteractingDrug',
        drug_id: nProp.drug_id ? Number(nProp.drug_id) : undefined,
      });
    }

    if (conn.rel) {
      edges.push({
        id: `${centerProp.canonical_name}-${nProp.canonical_name}`,
        source: centerProp.canonical_name,
        target: nProp.canonical_name,
        type: 'INTERACTS_WITH',
        severity: conn.rel.properties?.severity_level || 'Unknown',
        mechanism: conn.rel.properties?.mechanism_categories?.join('; ') || 'General interaction',
      });
    }
  }

  return { center: centerNode, nodes, edges };
}

/**
 * CREATE (C): Add or merge a custom interaction edge between two drugs.
 */
export async function createGraphInteraction(
  drugA: string,
  drugB: string,
  severity: string = 'Major',
  mechanism: string = 'Experimental clinical observation'
): Promise<boolean> {
  // MERGE on the bare (a)-[:INTERACTS_WITH]-(b) pattern — no distinguishing
  // property in the pattern itself — so this genuinely merges into any
  // existing edge between the pair instead of creating a parallel duplicate
  // relationship alongside it (which silently happened before this fix,
  // since a differentiating property in the MERGE pattern makes it a
  // different match key for Neo4j's MERGE semantics).
  const cypher = `
    MERGE (a:Drug {canonical_name: toLower($drugA)})
    MERGE (b:Drug {canonical_name: toLower($drugB)})
    MERGE (a)-[r:INTERACTS_WITH]-(b)
    SET r.severity_level = $severity,
        r.mechanism_categories = [$mechanism],
        r.evidence_sources = COALESCE(r.evidence_sources, 'DBMSStudioDemo'),
        r.updated_at = datetime()
    RETURN r
  `;
  await runCypher(cypher, {
    drugA: drugA.trim(),
    drugB: drugB.trim(),
    severity,
    mechanism,
  });
  return true;
}

/**
 * UPDATE (U): Modify properties of an existing edge.
 */
export async function updateGraphInteraction(
  drugA: string,
  drugB: string,
  severity: string,
  mechanism?: string
): Promise<boolean> {
  const cypher = `
    MATCH (a:Drug)-[r:INTERACTS_WITH]-(b:Drug)
    WHERE toLower(a.canonical_name) = toLower($drugA)
      AND toLower(b.canonical_name) = toLower($drugB)
    SET r.severity_level = $severity,
        r.mechanism_categories = CASE WHEN $mechanism IS NULL THEN r.mechanism_categories ELSE [$mechanism] END,
        r.updated_at = datetime()
    RETURN r
  `;
  const result = await runCypher(cypher, {
    drugA: drugA.trim(),
    drugB: drugB.trim(),
    severity,
    mechanism: mechanism || null,
  });
  return result.length > 0;
}

/**
 * DELETE (D): Remove an interaction edge between two drugs in Neo4j.
 */
export async function deleteGraphInteraction(drugA: string, drugB: string): Promise<boolean> {
  const cypher = `
    MATCH (a:Drug)-[r:INTERACTS_WITH]-(b:Drug)
    WHERE toLower(a.canonical_name) = toLower($drugA)
      AND toLower(b.canonical_name) = toLower($drugB)
    DELETE r
    RETURN count(r) AS deleted_count
  `;
  const result = await runCypher<{ deleted_count: number }>(cypher, {
    drugA: drugA.trim(),
    drugB: drugB.trim(),
  });
  return (result[0]?.deleted_count || 0) > 0;
}
