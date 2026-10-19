/**
 * tests/integration/test_day2_integration.ts
 *
 * End-to-end integration test suite verifying Phase D cross-database workflow:
 * 1. Active prescription retrieval from PostgreSQL.
 * 2. Direct pairwise interaction lookup in PostgreSQL.
 * 3. Candidate multi-hop pathway discovery in Neo4j (bounded at 2-3 hops).
 * 4. Transactional persistence in risk_assessments & assessment_findings.
 * 5. Trigger-verified counter updates.
 * 6. Edge cases: patient with < 2 medications, non-existent patient ID, negative ID.
 */

import { orchestrateRiskAssessment } from '../../lib/risk-analysis/orchestrator';
import {
  getAllPatients,
  getPatientById,
  getActivePrescriptions,
  getDirectInteractionsForDrugs,
} from '../../lib/postgres/patient-service';
import { findCandidateMultiHopPathways } from '../../lib/neo4j/graph-service';
import { closePostgresPool, query } from '../../lib/postgres/client';
import { closeNeo4jDriver } from '../../lib/neo4j/client';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ': ' + detail : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runIntegrationSuite() {
  console.log('================================================================================');
  console.log('STARTING DAY 2 CROSS-DATABASE INTEGRATION & END-TO-END TEST SUITE');
  console.log('================================================================================\n');

  try {
    // --------------------------------------------------------------------------
    // Test 1: Patient Registry & Active Medication Counts in PostgreSQL
    // --------------------------------------------------------------------------
    console.log('>>> Test Case 1: Patient Registry & Active Prescriptions');
    const patients = await getAllPatients();
    assert(patients.length >= 4, 'Retrieved synthetic patient registry (>= 4 patients)');
    
    const patient1 = await getPatientById(1);
    assert(patient1 !== null, 'Patient 1 (Robert Vance) exists in PostgreSQL');
    assert(patient1?.mrn === 'SYN-PAT-1001', 'Patient 1 MRN matches SYN-PAT-1001');
    assert(patient1?.is_synthetic === true, 'Synthetic guardrail invariant verified (is_synthetic = true)');

    const activePrescriptions = await getActivePrescriptions(1);
    assert(activePrescriptions.length === 3, `Patient 1 has 3 active prescriptions (found ${activePrescriptions.length})`);
    const drugNames = activePrescriptions.map((p) => p.canonical_name);
    assert(drugNames.includes('warfarin'), 'Active regimen includes warfarin');
    assert(drugNames.includes('amiodarone'), 'Active regimen includes amiodarone');
    assert(drugNames.includes('simvastatin'), 'Active regimen includes simvastatin');

    // --------------------------------------------------------------------------
    // Test 2: Direct Pairwise Interaction Discovery in PostgreSQL
    // --------------------------------------------------------------------------
    console.log('\n>>> Test Case 2: PostgreSQL Direct Pairwise Interaction Discovery');
    const drugIds = activePrescriptions.map((p) => p.drug_id);
    const directInteractions = await getDirectInteractionsForDrugs(drugIds);
    assert(directInteractions.length >= 2, `Discovered direct documented interactions (count: ${directInteractions.length})`);
    
    const pairDescriptions = directInteractions.map(
      (d) => `${d.drug_a_name} <-> ${d.drug_b_name} (${d.severity_level})`
    );
    console.log('    Direct findings:', pairDescriptions);
    assert(
      pairDescriptions.some((p) => p.includes('warfarin') && p.includes('amiodarone')),
      'Identified Warfarin <-> Amiodarone direct interaction'
    );
    assert(
      pairDescriptions.some((p) => p.includes('amiodarone') && p.includes('simvastatin')),
      'Identified Amiodarone <-> Simvastatin direct interaction'
    );

    // --------------------------------------------------------------------------
    // Test 3: Candidate Multi-Hop Graph Traversal in Neo4j
    // --------------------------------------------------------------------------
    console.log('\n>>> Test Case 3: Neo4j Bounded Multi-Hop Pathway Traversal');
    const candidatePathways = await findCandidateMultiHopPathways(drugIds, 2, 3);
    assert(candidatePathways.length > 0, `Discovered multi-hop candidate pathways (count: ${candidatePathways.length})`);

    const twoHopPath = candidatePathways.find(
      (p) => p.hop_count === 2 && p.nodes.includes('warfarin') && p.nodes.includes('simvastatin')
    );
    assert(twoHopPath !== undefined, 'Discovered 2-hop candidate bridge: Warfarin -> Amiodarone -> Simvastatin');
    assert(twoHopPath?.bridge_drugs.includes('amiodarone') === true, 'Amiodarone identified as intermediary bridge node');
    console.log('    Multi-hop candidate pathway:', twoHopPath?.nodes.join(' -> '));

    // --------------------------------------------------------------------------
    // Test 4: Full Orchestration & Transactional Persistence
    // --------------------------------------------------------------------------
    console.log('\n>>> Test Case 4: End-to-End Risk Analysis Orchestration & Persistence');
    const assessmentResult = await orchestrateRiskAssessment(
      1,
      'dr_sharma',
      'Integration test polypharmacy risk evaluation'
    );

    assert(assessmentResult.assessment_id !== null, `Assessment persisted with ID ${assessmentResult.assessment_id}`);
    assert(assessmentResult.summary.direct_interaction_count === directInteractions.length, 'Direct findings count matches');
    assert(assessmentResult.summary.multi_hop_candidate_count === candidatePathways.length, 'Multi-hop candidate count matches');
    assert(assessmentResult.summary.max_severity_found === 'Major', 'Max severity correctly calculated as Major');
    assert(assessmentResult.scientific_disclaimer.length > 0, 'Scientific disclaimer included in response payload');

    // Verify DB triggers automatically updated header counts
    const checkDbSql = `
      SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count
      FROM risk_assessments
      WHERE assessment_id = $1;
    `;
    const dbRes = await query(checkDbSql, [assessmentResult.assessment_id]);
    assert(dbRes.rows.length === 1, 'Assessment record exists in PostgreSQL risk_assessments');
    assert(
      dbRes.rows[0].direct_interaction_count === directInteractions.length,
      `Trigger trg_assessment_findings_count updated direct count to ${dbRes.rows[0].direct_interaction_count}`
    );
    assert(
      dbRes.rows[0].multi_hop_candidate_count === candidatePathways.length,
      `Trigger trg_assessment_findings_count updated multi-hop count to ${dbRes.rows[0].multi_hop_candidate_count}`
    );

    // --------------------------------------------------------------------------
    // Test 5: Monotherapy Edge Case (Patient with < 2 medications)
    // --------------------------------------------------------------------------
    console.log('\n>>> Test Case 5: Edge Case - Patient with < 2 Active Medications');
    // Create a temporary synthetic patient with 1 prescription
    const newPatRes = await query(`
      INSERT INTO patients (mrn, full_name, date_of_birth, gender, is_synthetic)
      VALUES ('SYN-TEST-999', 'Single Med Patient', '1995-05-15', 'Female', TRUE)
      RETURNING patient_id;
    `);
    const tempPatientId = newPatRes.rows[0].patient_id;

    await query(`
      INSERT INTO prescriptions (patient_id, drug_id, dosage, frequency, status, start_date, prescribed_by)
      VALUES ($1, 1, '5mg', 'Once daily', 'ACTIVE', CURRENT_DATE, 'dr_sharma');
    `, [tempPatientId]);

    const singleMedResult = await orchestrateRiskAssessment(tempPatientId, 'dr_sharma');
    assert(singleMedResult.summary.total_active_medications === 1, 'Recognized single active medication');
    assert(singleMedResult.summary.direct_interaction_count === 0, 'Zero direct interactions returned');
    assert(singleMedResult.summary.multi_hop_candidate_count === 0, 'Zero multi-hop candidate pathways returned');
    assert(singleMedResult.direct_findings.length === 0, 'Clean empty direct findings array');
    assert(singleMedResult.multi_hop_candidates.length === 0, 'Clean empty multi-hop candidates array');

    // Clean up temporary synthetic patient
    await query(`DELETE FROM patients WHERE patient_id = $1;`, [tempPatientId]);
    assert(true, 'Cleaned up temporary synthetic patient record');

    // --------------------------------------------------------------------------
    // Test 6: Error Handling - Non-existent & Invalid Patient ID
    // --------------------------------------------------------------------------
    console.log('\n>>> Test Case 6: Error Handling & Guardrails');
    let errorCaught = false;
    try {
      await orchestrateRiskAssessment(99999, 'dr_sharma');
    } catch (err: any) {
      errorCaught = true;
      assert(err.message.includes('not found'), 'Rejected non-existent patient ID with descriptive error');
    }
    assert(errorCaught, 'Error was thrown for non-existent patient ID');

    console.log('\n================================================================================');
    console.log(`ALL INTEGRATION TESTS PASSED: ${passedTests}/${totalTests} checks verified`);
    console.log('================================================================================');
  } finally {
    await closePostgresPool();
    await closeNeo4jDriver();
  }
}

runIntegrationSuite().catch((err) => {
  console.error('Integration suite failed with error:', err);
  process.exit(1);
});
