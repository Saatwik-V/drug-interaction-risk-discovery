import {
  getPatientById,
  getActivePrescriptions,
  getDirectInteractionsForDrugs,
  persistAssessmentWithFindings,
  FindingToInsert,
  Patient,
  PrescriptionWithDrug,
  DirectInteractionResult,
} from '../postgres/patient-service';
import {
  findCandidateMultiHopPathways,
  CandidatePathway,
} from '../neo4j/graph-service';

export interface RiskAssessmentResponse {
  assessment_id: number | null;
  patient: Patient;
  active_prescriptions: PrescriptionWithDrug[];
  summary: {
    total_active_medications: number;
    direct_interaction_count: number;
    multi_hop_candidate_count: number;
    max_severity_found: string;
    max_hop_depth_searched: number;
  };
  direct_findings: DirectInteractionResult[];
  multi_hop_candidates: CandidatePathway[];
  scientific_disclaimer: string;
}

const SEVERITY_RANK: Record<string, number> = {
  Major: 4,
  Moderate: 3,
  Minor: 2,
  Unknown: 1,
  None: 0,
};

function determineMaxSeverity(
  directFindings: DirectInteractionResult[],
  multiHopCandidates: CandidatePathway[]
): string {
  let highest = 'None';
  let highestRank = 0;

  for (const df of directFindings) {
    const rank = SEVERITY_RANK[df.severity_level] || 1;
    if (rank > highestRank) {
      highestRank = rank;
      highest = df.severity_level;
    }
  }

  for (const mhc of multiHopCandidates) {
    for (const sev of mhc.edge_severities) {
      const rank = SEVERITY_RANK[sev] || 1;
      if (rank > highestRank) {
        highestRank = rank;
        highest = sev;
      }
    }
  }

  return highest;
}

export async function orchestrateRiskAssessment(
  patientId: number,
  doctorUsername = 'dr_sharma',
  notes = 'Automated polypharmacy multi-hop risk assessment'
): Promise<RiskAssessmentResponse> {
  // 1. Validate patient existence
  const patient = await getPatientById(patientId);
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found.`);
  }

  // 2. Fetch active prescriptions
  const activePrescriptions = await getActivePrescriptions(patientId);
  const drugIds = Array.from(new Set(activePrescriptions.map((p) => p.drug_id)));

  // If patient has 0 or 1 active medication, no interactions are possible
  if (drugIds.length < 2) {
    return {
      assessment_id: null,
      patient,
      active_prescriptions: activePrescriptions,
      summary: {
        total_active_medications: drugIds.length,
        direct_interaction_count: 0,
        multi_hop_candidate_count: 0,
        max_severity_found: 'None',
        max_hop_depth_searched: 1,
      },
      direct_findings: [],
      multi_hop_candidates: [],
      scientific_disclaimer:
        'Patient has fewer than 2 active medications. No pairwise interactions or multi-hop pathways are possible.',
    };
  }

  // 3. Query PostgreSQL for documented direct interactions
  const directFindings = await getDirectInteractionsForDrugs(drugIds);

  // 4. Query Neo4j for candidate multi-hop pathways (2 to 3 hops)
  let multiHopCandidates: CandidatePathway[] = [];
  try {
    multiHopCandidates = await findCandidateMultiHopPathways(drugIds, 2, 3);
  } catch (neoErr) {
    console.error('Neo4j multi-hop exploration encountered an error:', neoErr);
    // Graceful fallback: direct findings are still valid even if Neo4j is temporarily impaired
  }

  // 5. Prepare findings to persist in PostgreSQL
  const findingsToInsert: FindingToInsert[] = [];

  // Direct findings (Hop 1)
  for (const df of directFindings) {
    findingsToInsert.push({
      drug_a_id: df.drug_a_id,
      drug_b_id: df.drug_b_id,
      hop_count: 1,
      traversal_path: `${df.drug_a_name} <-> ${df.drug_b_name}`,
      severity_level: df.severity_level,
      mechanism_category: df.mechanism_categories,
      evidence_sources: df.evidence_sources,
      finding_type: 'DOCUMENTED_DIRECT',
    });
  }

  // Multi-hop candidates (Hop 2 and 3)
  for (const mhc of multiHopCandidates) {
    findingsToInsert.push({
      drug_a_id: mhc.drug_a_id,
      drug_b_id: mhc.drug_b_id,
      hop_count: mhc.hop_count,
      traversal_path: mhc.nodes.join(' -> '),
      severity_level: mhc.edge_severities[0] || 'Unknown',
      mechanism_category: mhc.edge_mechanisms.flat().slice(0, 3).join('; '),
      evidence_sources: mhc.edge_sources.join('; '),
      finding_type: 'CANDIDATE_PATHWAY',
    });
  }

  // 6. Persist assessment session and findings in PostgreSQL
  const assessmentId = await persistAssessmentWithFindings(
    patientId,
    doctorUsername,
    drugIds.length,
    3,
    notes,
    findingsToInsert
  );

  const maxSeverity = determineMaxSeverity(directFindings, multiHopCandidates);

  return {
    assessment_id: assessmentId,
    patient,
    active_prescriptions: activePrescriptions,
    summary: {
      total_active_medications: drugIds.length,
      direct_interaction_count: directFindings.length,
      multi_hop_candidate_count: multiHopCandidates.length,
      max_severity_found: maxSeverity,
      max_hop_depth_searched: 3,
    },
    direct_findings: directFindings,
    multi_hop_candidates: multiHopCandidates,
    scientific_disclaimer:
      'Candidate pathways returned by graph traversal represent mechanistic polypharmacy hypotheses for clinical review and do not constitute proof of clinical adverse interaction.',
  };
}
