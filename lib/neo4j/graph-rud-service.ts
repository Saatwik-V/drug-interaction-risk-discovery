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
      rel: { properties: { severity_level?: string; mechanism_category?: string } };
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
        mechanism: conn.rel.properties?.mechanism_category || 'General Interaction',
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
  const cypher = `
    MERGE (a:Drug {canonical_name: toLower($drugA)})
    MERGE (b:Drug {canonical_name: toLower($drugB)})
    MERGE (a)-[r:INTERACTS_WITH {source_dataset: 'CustomAdmin'}]->(b)
    SET r.severity_level = $severity,
        r.mechanism_category = $mechanism,
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
        r.mechanism_category = COALESCE($mechanism, r.mechanism_category),
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
