// ==============================================================================
// 02_import.cypher
// Idempotent Data Import and Demonstration Seeding Script
// Patient-Specific Multi-Hop Drug Interaction Risk Discovery
// ==============================================================================

// ------------------------------------------------------------------------------
// Part A: Seed Curated Demonstration Drugs (Core Polypharmacy Test Cohort)
// ------------------------------------------------------------------------------

UNWIND [
  {id: 1, name: "warfarin", pubchem: "54678486", type: "Small molecule", class: "Anticoagulants"},
  {id: 2, name: "aspirin", pubchem: "2244", type: "Small molecule", class: "Platelet Aggregation Inhibitors"},
  {id: 3, name: "ibuprofen", pubchem: "3672", type: "Small molecule", class: "Anti-Inflammatory Agents, Non-Steroidal"},
  {id: 4, name: "amiodarone", pubchem: "2157", type: "Small molecule", class: "Anti-Arrhythmia Agents"},
  {id: 5, name: "simvastatin", pubchem: "54454", type: "Small molecule", class: "Anticholesteremic Agents"},
  {id: 6, name: "clarithromycin", pubchem: "84029", type: "Small molecule", class: "Anti-Bacterial Agents"},
  {id: 7, name: "metoprolol", pubchem: "4171", type: "Small molecule", class: "Adrenergic beta-Antagonists"},
  {id: 8, name: "lisinopril", pubchem: "5362119", type: "Small molecule", class: "Angiotensin-Converting Enzyme Inhibitors"},
  {id: 9, name: "fluoxetine", pubchem: "3386", type: "Small molecule", class: "Serotonin Uptake Inhibitors"},
  {id: 10, name: "tramadol", pubchem: "33741", type: "Small molecule", class: "Analgesics, Opioid"}
] AS d
MERGE (drug:Drug {drug_id: d.id})
ON CREATE SET 
  drug.canonical_name = d.name,
  drug.pubchem_cid = d.pubchem,
  drug.drug_type = d.type,
  drug.therapeutic_class = d.class,
  drug.created_at = datetime()
ON MATCH SET
  drug.canonical_name = d.name,
  drug.pubchem_cid = d.pubchem;

// ------------------------------------------------------------------------------
// Part B: Seed Documented Interaction Pairs with Severity & Mechanisms
// ------------------------------------------------------------------------------

UNWIND [
  // 1. Warfarin <-> Aspirin (Major Pharmacodynamic Additive Bleeding Risk)
  {
    id_a: 1, id_b: 2, pair_id: 1001, severity: "Major", 
    mechanisms: ["Pharmacodynamic additive effects"], source: "DDInter+MecDDI"
  },
  // 2. Warfarin <-> Ibuprofen (Major Additive / Metabolism Risk)
  {
    id_a: 1, id_b: 3, pair_id: 1002, severity: "Major", 
    mechanisms: ["Pharmacodynamic additive effects", "Affected intra_extra-hepatic metabolism"], source: "DDInter+MecDDI"
  },
  // 3. Warfarin <-> Amiodarone (Major Metabolic Clearance Inhibition)
  {
    id_a: 1, id_b: 4, pair_id: 1003, severity: "Major", 
    mechanisms: ["Affected intra_extra-hepatic metabolism"], source: "DDInter+MecDDI"
  },
  // 4. Amiodarone <-> Simvastatin (Major Competitive CYP3A4 Statin Toxicity)
  {
    id_a: 4, id_b: 5, pair_id: 1004, severity: "Major", 
    mechanisms: ["Affected intra_extra-hepatic metabolism"], source: "DDInter+MecDDI"
  },
  // 5. Simvastatin <-> Clarithromycin (Major Hepatic Transporter & CYP Inhibition)
  {
    id_a: 5, id_b: 6, pair_id: 1005, severity: "Major", 
    mechanisms: ["Affected cellular transport", "Affected intra_extra-hepatic metabolism"], source: "DDInter+MecDDI"
  },
  // 6. Metoprolol <-> Amiodarone (Moderate Additive Bradycardia)
  {
    id_a: 4, id_b: 7, pair_id: 1006, severity: "Moderate", 
    mechanisms: ["Pharmacodynamic additive effects"], source: "DDInter+MecDDI"
  },
  // 7. Lisinopril <-> Aspirin (Moderate Renal Clearance / Hemodynamic Interaction)
  {
    id_a: 2, id_b: 8, pair_id: 1007, severity: "Moderate", 
    mechanisms: ["Affected excretion pathways"], source: "DDInter+MecDDI"
  },
  // 8. Fluoxetine <-> Tramadol (Major Serotonin Syndrome & Clearance Risk)
  {
    id_a: 9, id_b: 10, pair_id: 1008, severity: "Major", 
    mechanisms: ["Pharmacodynamic additive effects", "Affected intra_extra-hepatic metabolism"], source: "DDInter+MecDDI"
  },
  // 9. Metoprolol <-> Fluoxetine (Moderate CYP2D6 Clearance Inhibition)
  {
    id_a: 7, id_b: 9, pair_id: 1009, severity: "Moderate", 
    mechanisms: ["Affected intra_extra-hepatic metabolism"], source: "DDInter+MecDDI"
  }
] AS rel
MATCH (d1:Drug {drug_id: rel.id_a})
MATCH (d2:Drug {drug_id: rel.id_b})
MERGE (d1)-[r:INTERACTS_WITH]-(d2)
ON CREATE SET 
  r.pair_id = rel.pair_id,
  r.severity_level = rel.severity,
  r.mechanism_categories = rel.mechanisms,
  r.evidence_sources = rel.source,
  r.created_at = datetime()
ON MATCH SET
  r.severity_level = rel.severity,
  r.mechanism_categories = rel.mechanisms;

// ------------------------------------------------------------------------------
// Part C: Batch LOAD CSV Template for Full Processed Ingestion (When Staged)
// ------------------------------------------------------------------------------
// :auto USING PERIODIC COMMIT 1000
// LOAD CSV WITH HEADERS FROM 'file:///processed_drugs.csv' AS row
// MERGE (d:Drug {drug_id: toInteger(row.drug_id)})
// SET d.canonical_name = row.canonical_name, d.pubchem_cid = row.pubchem_cid;
//
// :auto USING PERIODIC COMMIT 1000
// LOAD CSV WITH HEADERS FROM 'file:///processed_pairs.csv' AS row
// MATCH (d1:Drug {drug_id: toInteger(row.drug_a_id)})
// MATCH (d2:Drug {drug_id: toInteger(row.drug_b_id)})
// MERGE (d1)-[r:INTERACTS_WITH]->(d2)
// SET r.pair_id = toInteger(row.pair_id),
//     r.severity_level = row.severity_level,
//     r.evidence_sources = row.evidence_sources;
