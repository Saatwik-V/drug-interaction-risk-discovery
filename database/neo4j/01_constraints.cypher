// ==============================================================================
// 01_constraints.cypher
// Neo4j Schema Constraints and Performance Indexes
// Patient-Specific Multi-Hop Drug Interaction Risk Discovery
// ==============================================================================

// 1. Uniqueness constraint on canonical Drug ID
CREATE CONSTRAINT unique_drug_id IF NOT EXISTS
FOR (d:Drug)
REQUIRE d.drug_id IS UNIQUE;

// 2. Uniqueness constraint on canonical Drug name
CREATE CONSTRAINT unique_drug_canonical_name IF NOT EXISTS
FOR (d:Drug)
REQUIRE d.canonical_name IS UNIQUE;

// 3. Performance index on Drug chemical identifiers
CREATE INDEX idx_drug_pubchem IF NOT EXISTS
FOR (d:Drug)
ON (d.pubchem_cid);

// 4. Performance index on relationship severity for filtered traversals
CREATE INDEX idx_rel_severity IF NOT EXISTS
FOR ()-[r:INTERACTS_WITH]-()
ON (r.severity_level);

// 5. Performance index on relationship evidence source
CREATE INDEX idx_rel_source IF NOT EXISTS
FOR ()-[r:INTERACTS_WITH]-()
ON (r.evidence_sources);
