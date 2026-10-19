import { runCypher } from './client';

export interface CandidatePathway {
  drug_a_id: number;
  drug_a_name: string;
  drug_b_id: number;
  drug_b_name: string;
  hop_count: number;
  nodes: string[];
  node_ids: number[];
  edge_severities: string[];
  edge_mechanisms: string[][];
  edge_sources: string[];
  bridge_drugs: string[];
  finding_type: 'CANDIDATE_PATHWAY';
}

/**
 * Discovers candidate multi-hop interaction pathways between prescribed medications.
 * Strictly bounds search between minHops and maxHops (default: 2 to 3 hops).
 * Restricts traversal to prevent cycles and duplicate symmetric paths.
 */
export async function findCandidateMultiHopPathways(
  activeDrugIds: number[],
  minHops = 2,
  maxHops = 3
): Promise<CandidatePathway[]> {
  if (activeDrugIds.length < 2) {
    return [];
  }

  // Cypher query enforcing:
  // 1. Endpoints belong to the patient's active medication list.
  // 2. Unordered pair ordering: d1.drug_id < d2.drug_id to prevent reverse duplicates.
  // 3. Simple path: nodes in path must not repeat (cycle prevention).
  // 4. Bounded depth between minHops and maxHops.
  const cypher = `
    MATCH path = (d1:Drug)-[r:INTERACTS_WITH*${minHops}..${maxHops}]-(d2:Drug)
    WHERE d1.drug_id IN $activeDrugIds
      AND d2.drug_id IN $activeDrugIds
      AND d1.drug_id < d2.drug_id
      AND ALL(n IN nodes(path) WHERE size([m IN nodes(path) WHERE m = n]) = 1)
    RETURN 
      d1.drug_id AS drug_a_id,
      d1.canonical_name AS drug_a_name,
      d2.drug_id AS drug_b_id,
      d2.canonical_name AS drug_b_name,
      length(path) AS hop_count,
      [n IN nodes(path) | n.canonical_name] AS nodes,
      [n IN nodes(path) | n.drug_id] AS node_ids,
      [rel IN relationships(path) | rel.severity_level] AS edge_severities,
      [rel IN relationships(path) | rel.mechanism_categories] AS edge_mechanisms,
      [rel IN relationships(path) | rel.evidence_sources] AS edge_sources
    ORDER BY hop_count ASC, drug_a_id ASC, drug_b_id ASC
    LIMIT 50;
  `;

  interface CypherRow {
    drug_a_id: { low: number } | number;
    drug_a_name: string;
    drug_b_id: { low: number } | number;
    drug_b_name: string;
    hop_count: { low: number } | number;
    nodes: string[];
    node_ids: Array<{ low: number } | number>;
    edge_severities: string[];
    edge_mechanisms: string[][];
    edge_sources: string[];
  }

  const rows = await runCypher<CypherRow>(cypher, { activeDrugIds });

  return rows.map((r) => {
    const toNum = (val: { low: number } | number): number =>
      typeof val === 'object' && val !== null ? val.low : val;

    const nodeNames = r.nodes;
    // Intermediary bridge drugs are all nodes between the first and last endpoints
    const bridgeDrugs = nodeNames.slice(1, nodeNames.length - 1);

    return {
      drug_a_id: toNum(r.drug_a_id),
      drug_a_name: r.drug_a_name,
      drug_b_id: toNum(r.drug_b_id),
      drug_b_name: r.drug_b_name,
      hop_count: toNum(r.hop_count),
      nodes: nodeNames,
      node_ids: r.node_ids.map(toNum),
      edge_severities: r.edge_severities,
      edge_mechanisms: r.edge_mechanisms,
      edge_sources: r.edge_sources,
      bridge_drugs: bridgeDrugs,
      finding_type: 'CANDIDATE_PATHWAY',
    };
  });
}
