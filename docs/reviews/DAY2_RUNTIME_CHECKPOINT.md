# Day 2 — Database Runtime Checkpoint and Verification Report

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course Context:** PES University — DBMS Experiential Learning Level 3 (August–December 2026)  
**Date:** October 19, 2026  
**Auditor / Engineer:** Antigravity Autonomous Coding Agent  
**Checkpoint Status:** **PASS (Both PostgreSQL 16 and Neo4j 5 Fully Verified at Runtime)**

---

## 1. Executive Summary

This checkpoint establishes the runtime status of both relational (PostgreSQL) and graph (Neo4j) database layers for Day 2 execution. Following Docker Desktop provisioning on the host macOS system, Docker Compose was used to stand up disposable local development instances of PostgreSQL 16 and Neo4j 5 Community.

All DDL schemas, constraints, indexes, synthetic seed cohorts, required queries, procedures, triggers, and Cypher traversals were executed against live running database engines. One defect in the PostgreSQL stored function `fn_perform_patient_direct_screening` was identified, corrected, and verified.

---

## 2. Environment and Database Versions

| Component | Host / Container Environment | Exact Version Detected | Port / Protocol | Connection Identifier |
|---|---|---|---|---|
| **Host OS** | macOS Darwin 24.1.0 (Apple Silicon aarch64) | macOS 15.x | N/A | Localhost |
| **Container Engine** | Docker Engine - Community | `29.3.1` (build `c2be9ccfc3`) | Unix Socket | `desktop-linux` context |
| **Orchestration** | Docker Compose | `v5.1.1` | Local | `docker-compose.yml` |
| **PostgreSQL** | Container `drug-interaction-postgres` (`postgres:16-alpine`) | **PostgreSQL 16.15** on `aarch64-unknown-linux-musl` | `5432/tcp` | `drug_interaction_db` (`postgres:postgres`) |
| **Neo4j** | Container `drug-interaction-neo4j` (`neo4j:5-community`) | **Neo4j Kernel 5.26.32** Community | `7474/tcp` (HTTP), `7687/tcp` (Bolt) | `neo4j` (`neo4j:password123`) |
| **Node.js runtime** | Host CLI | `v24.10.0` (npm `11.6.0`) | N/A | `/opt/homebrew/bin/node` |
| **Python runtime** | Host CLI | `3.13.5` (Pandas `3.0.5`) | N/A | `/opt/anaconda3/bin/python3` |

---

## 3. PostgreSQL Runtime Verification

### 3.1 Script Execution Results

| Script File | Execution Command | Result | Rows Affected / Objects Created |
|---|---|:---:|---|
| `database/postgres/01_schema.sql` | `docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/01_schema.sql` | **PASS** | 10 tables created: `drugs`, `drug_source_mappings`, `ddi_pairs`, `ddi_severities`, `ddi_mechanisms`, `patients`, `prescriptions`, `risk_assessments`, `assessment_findings`, `user_accounts`. Comments added to tables and constraints. |
| `database/postgres/02_constraints_indexes.sql` | `docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/02_constraints_indexes.sql` | **PASS** | 13 indexes created (B-tree & composite), 1 view (`vw_active_patient_medications`), 1 trigger function (`fn_update_assessment_counts`), 1 trigger (`trg_assessment_findings_count`), 1 stored function (`fn_perform_patient_direct_screening`). |
| `database/postgres/03_seed_synthetic.sql` | `docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/03_seed_synthetic.sql` | **PASS** | Inserted 10 canonical drugs, 20 source mappings, 9 canonical pairs, 9 severity rows, 12 mechanism rows, 4 synthetic patients, 11 active prescriptions, 2 user accounts. Sequences synchronized. |
| `database/postgres/04_required_queries.sql` | `docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/04_required_queries.sql` | **PASS** | Executed: DML (INSERT, SELECT, UPDATE with check), 4-table JOIN, correlated subquery (polypharmacy count), nested subquery, window functions (`DENSE_RANK`, `ROW_NUMBER`), and recursive CTE (2-hop candidate path discovery). |

### 3.2 Negative Constraint & Invariant Tests (PostgreSQL)

| Test Case | Invariant Evaluated | SQL Command Executed | Observed Result | Status |
|---|---|---|---|:---:|
| **Self-Pair Rejection** | Prevent identical endpoints (`drug_a_id = drug_b_id`) | `INSERT INTO ddi_pairs (drug_a_id, drug_b_id) VALUES (1, 1);` | Rejected by `ck_pair_canonical_ordering` (`check_violation`) | **PASS** |
| **Reverse Inverted Pair** | Guarantee canonical ordering (`drug_a_id < drug_b_id`) | `INSERT INTO ddi_pairs (drug_a_id, drug_b_id) VALUES (5, 2);` | Rejected by `ck_pair_canonical_ordering` (`check_violation`) | **PASS** |
| **Duplicate Pair** | Uniqueness of canonical interaction pairs | `INSERT INTO ddi_pairs (drug_a_id, drug_b_id) VALUES (1, 4);` | Rejected by `uq_pair_endpoints` (`unique_violation`) | **PASS** |
| **Invalid Severity Domain** | Strict severity domain check | `INSERT INTO ddi_severities (pair_id, severity_level, source_dataset) VALUES (1001, 'Catastrophic', 'DDInter');` | Rejected by `ck_severity_level` (`check_violation`) | **PASS** |
| **Synthetic Guardrail** | Prohibit non-synthetic clinical data | `INSERT INTO patients (mrn, full_name, date_of_birth, gender, is_synthetic) VALUES ('REAL-001', 'Real Person', '1980-01-01', 'Male', FALSE);` | Rejected by `ck_patients_synthetic_guardrail` (`check_violation`) | **PASS** |
| **Trigger Invocation** | Increment findings counter automatically | Executed `fn_perform_patient_direct_screening(1, 'dr_sharma')` which inserted 2 findings | `direct_interaction_count` on `risk_assessments` row automatically incremented to `2` | **PASS** |
| **Transaction Rollback** | Atomic rollback on error | Inserted prescription inside `BEGIN`, verified count=1, issued `ROLLBACK;`, verified count=0 | Uncommitted transaction rolled back cleanly | **PASS** |

---

## 4. Neo4j Runtime Verification

### 4.1 Script Execution Results

| Script File | Execution Command | Result | Nodes / Relationships Created |
|---|---|:---:|---|
| `database/neo4j/01_constraints.cypher` | `docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/01_constraints.cypher` | **PASS** | Created 2 uniqueness constraints (`Drug.drug_id`, `Drug.canonical_name`) and 3 performance indexes (`pubchem_cid`, `severity_level`, `evidence_sources`). |
| `database/neo4j/02_import.cypher` | `docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/02_import.cypher` | **PASS** | Merged 10 `:Drug` nodes and 9 `[:INTERACTS_WITH]` relationships with embedded severity levels and mechanism arrays. |
| `database/neo4j/03_queries.cypher` | `docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/03_queries.cypher` | **PASS** | Successfully executed: direct pair lookup, single-drug interaction profile, patient medication cohort screening, 2-hop candidate path traversal, intermediary bridge discovery, and full NoSQL CRUD (Create, Read, Update, Delete with degree centrality). |

### 4.2 Multi-Hop Path Traversals (Neo4j)

| Traversal Pattern | Drugs Evaluated | Cypher Query Pattern | Result Observed | Interpretation Policy |
|---|---|---|---|---|
| **Direct Interaction (1-Hop)** | Warfarin (1) & Amiodarone (4) | `MATCH (d1)-[r:INTERACTS_WITH]-(d2)` | Found direct edge: Major severity, `Affected intra_extra-hepatic metabolism` | **Documented Direct Evidence** |
| **2-Hop Candidate Pathway** | Warfarin (1) & Simvastatin (5) | `MATCH path = (d1:Drug {drug_id: 1})-[r:INTERACTS_WITH*2..2]-(d2:Drug {drug_id: 5})` | Returned `["warfarin", "amiodarone", "simvastatin"]` (Amiodarone is bridge) | **Candidate Polypharmacy Pathway** (not direct interaction proof) |
| **3-Hop Candidate Pathway** | Warfarin (1) & Clarithromycin (6) | `MATCH path = (d1:Drug {drug_id: 1})-[r:INTERACTS_WITH*3..3]-(d2:Drug {drug_id: 6})` | Returned `["warfarin", "amiodarone", "simvastatin", "clarithromycin"]` | **Candidate Polypharmacy Pathway** |
| **Disconnected Pair (No Path)** | Fluoxetine (9) & Lisinopril (8) | Bounded traversal at 2 hops | 0 records returned (Clean empty set) | **No Candidate Pathway Found** |

---

## 5. Defects Encountered and Fixes Made

During live PostgreSQL testing, one defect was discovered and resolved:
- **Defect:** Calling `fn_perform_patient_direct_screening` raised:
  `ERROR: structure of query does not match function result type: Returned type character varying(100) does not match expected type text in column 5`.
- **Root Cause:** Column 5 of the return table was declared as `mechanisms TEXT`, while the underlying table column `af.mechanism_category` was typed as `VARCHAR(100)`. PostgreSQL PL/pgSQL strict return type checking requires an explicit cast.
- **Fix Applied:** Modified `database/postgres/02_constraints_indexes.sql` to cast `af.mechanism_category::TEXT`. Re-executed the function; query returned the expected 2 interaction records for Patient 1.

---

## 6. How to Reproduce the Runtime Checkpoint

To re-run and verify the checkpoint independently on any system with Docker Desktop:

```bash
# 1. Start containers
docker compose up -d

# 2. Wait until healthy
docker compose ps

# 3. Test PostgreSQL schema, seeds, queries, and constraints
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/01_schema.sql
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/02_constraints_indexes.sql
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/03_seed_synthetic.sql
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/04_required_queries.sql

# 4. Test Neo4j constraints, import, and queries
docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/01_constraints.cypher
docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/02_import.cypher
docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/03_queries.cypher
```

**Remaining Blockers:** None. Both database engines are active, healthy, and verified at runtime.
