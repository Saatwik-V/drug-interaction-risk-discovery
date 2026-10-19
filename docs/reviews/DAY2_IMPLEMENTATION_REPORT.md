# Day 2 — Database Runtime Verification, Advanced SQL, Neo4j Graph Queries, and Backend Integration Report

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course Context:** PES University — DBMS Experiential Learning Level 3 (August–December 2026)  
**Date:** October 19, 2026  
**Status:** **DAY 2 COMPLETE — ALL RUNTIME AND INTEGRATION TESTS PASSING**

---

## 1. Executive Summary

Day 2 objectives have been completed and verified at runtime:
1. **Containerized Database Environment:** Disposable development instances of PostgreSQL 16 (`postgres:16-alpine`) and Neo4j 5 Community (`neo4j:5-community`) were provisioned via `docker-compose.yml` and verified as healthy.
2. **PostgreSQL Runtime Verification:** Executed DDL schema, constraints, indexes, synthetic patient cohorts, advanced joins, correlated subqueries, window functions, recursive CTEs, stored functions, triggers, and transaction rollbacks against live PostgreSQL 16.
3. **Neo4j Runtime Verification:** Executed constraints, property graph data imports, direct pairwise lookups, single-drug profiles, bounded multi-hop traversals ($k \le 3$), bridge node discovery, and complete NoSQL CRUD operations with degree centrality against live Neo4j 5.
4. **Defect Identified & Fixed:** Fixed a type-mismatch defect in stored procedure `fn_perform_patient_direct_screening` in `database/postgres/02_constraints_indexes.sql` where `af.mechanism_category` required explicit casting to `TEXT`.
5. **Backend Services & API Integration:** Built reusable service modules (`lib/postgres/client.ts`, `lib/neo4j/client.ts`, `lib/postgres/patient-service.ts`, `lib/neo4j/graph-service.ts`, `lib/risk-analysis/orchestrator.ts`) and Next.js Route Handlers (`/api/patients`, `/api/patients/[id]`, `/api/patients/[id]/analyze-risk`, `/api/alerts`).
6. **End-to-End Integration Testing:** Executed an automated integration suite (`tests/integration/test_day2_integration.ts`) validating 30 discrete assertions across prescription retrieval, direct interaction discovery, graph traversal, transactional persistence, trigger updates, monotherapy edge cases, and non-existent patient guardrails (100% pass rate).
7. **Git Safety:** Zero commits or pushes were made. All pre-existing Day 1 ER diagram files were left untouched for the teammate.

---

## 2. Files Created and Modified

### 2.1 Files Created
- [`docker-compose.yml`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docker-compose.yml) — Development orchestration for PostgreSQL 16 and Neo4j 5 Community.
- [`.env`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/.env) — Local development credentials (strictly Git-ignored).
- [`package.json`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/package.json) & [`tsconfig.json`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/tsconfig.json) — Next.js, React, `pg`, `neo4j-driver`, TypeScript configuration.
- [`lib/postgres/client.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/lib/postgres/client.ts) — PostgreSQL connection pool and parameterized query execution.
- [`lib/neo4j/client.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/lib/neo4j/client.ts) — Neo4j Bolt driver and Cypher session management.
- [`lib/postgres/patient-service.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/lib/postgres/patient-service.ts) — Patient retrieval, active prescription queries, direct DDI lookups, and transactional assessment persistence.
- [`lib/neo4j/graph-service.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/lib/neo4j/graph-service.ts) — Bounded candidate multi-hop pathway discovery ($k \in [2, 3]$) with cycle avoidance and path deduplication.
- [`lib/risk-analysis/orchestrator.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/lib/risk-analysis/orchestrator.ts) — Cross-database polypharmacy evaluation orchestrating PostgreSQL direct lookups, Neo4j multi-hop traversals, and persistence.
- [`app/api/patients/route.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/app/api/patients/route.ts) — `GET /api/patients` endpoint returning synthetic patient registry.
- [`app/api/patients/[id]/route.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/app/api/patients/[id]/route.ts) — `GET /api/patients/:id` endpoint returning patient info and active prescriptions.
- [`app/api/patients/[id]/analyze-risk/route.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/app/api/patients/[id]/analyze-risk/route.ts) — `POST /api/patients/:id/analyze-risk` endpoint executing cross-database evaluation and saving findings.
- [`app/api/alerts/route.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/app/api/alerts/route.ts) — `GET /api/alerts` endpoint returning historical assessments and findings.
- [`tests/integration/test_day2_integration.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/tests/integration/test_day2_integration.ts) — Comprehensive automated integration test suite.
- [`docs/reviews/DAY2_RUNTIME_CHECKPOINT.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/DAY2_RUNTIME_CHECKPOINT.md) — Detailed runtime checkpoint document.
- [`docs/reviews/DAY2_IMPLEMENTATION_REPORT.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/DAY2_IMPLEMENTATION_REPORT.md) — This final report.

### 2.2 Files Modified
- [`database/postgres/02_constraints_indexes.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/02_constraints_indexes.sql) — Cast `af.mechanism_category::TEXT` in `fn_perform_patient_direct_screening` to resolve return-type mismatch.

---

## 3. PostgreSQL Runtime Status and Test Results

- **Database Engine:** PostgreSQL 16.15 (Alpine Linux on aarch64), running on `localhost:5432`.
- **Status:** **PASS** (100% of SQL scripts and queries executed without error).

### 3.1 Rubric-Required SQL Features Demonstrated

| Rubric Feature Category | Implementation Location | SQL Concept / Query Demonstrated | Live Execution Result |
|---|---|---|:---:|
| **DDL & Constraints** | `01_schema.sql` | 10 tables, `SERIAL`/`BIGSERIAL` PKs, foreign keys with `ON DELETE CASCADE` / `RESTRICT`, `NOT NULL`, check constraints (`drug_a_id < drug_b_id`, `severity_level`, `is_synthetic = TRUE`), unique constraints (`uq_pair_endpoints`, `uq_drugs_canonical_name`). | **PASS** |
| **Indexes & Views** | `02_constraints_indexes.sql` | 13 B-tree & composite indexes (`idx_ddi_pairs_endpoints`, `idx_prescriptions_active`), 1 view (`vw_active_patient_medications`). | **PASS** |
| **DML Operations** | `04_required_queries.sql` | `INSERT` into `prescriptions`, `SELECT` with filtering, `UPDATE` with prescription status change, `DELETE` with referential integrity. | **PASS** |
| **Multi-Table Joins** | `04_required_queries.sql` | 4-table join (`prescriptions`, `ddi_pairs`, `drugs da`, `drugs db`, `ddi_severities`, `ddi_mechanisms`) identifying all pairwise interactions for Patient 1. | **PASS** |
| **Nested Subqueries** | `04_required_queries.sql` | Uncorrelated subquery identifying high-risk cardiovascular/anticoagulant drugs involved in Major interactions. | **PASS** |
| **Correlated Subqueries** | `04_required_queries.sql` | Correlated subquery computing active polypharmacy drug count per patient. | **PASS** |
| **Window Functions** | `04_required_queries.sql` | `DENSE_RANK() OVER (ORDER BY occurrence_count DESC)` ranking mechanism category popularity; `ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY start_date DESC)` ordering prescription recency. | **PASS** |
| **Recursive CTE** | `04_required_queries.sql` | Recursive Common Table Expression performing bounded 2-hop graph traversal in SQL (`warfarin -> amiodarone -> simvastatin`). | **PASS** |
| **Stored Function** | `02_constraints_indexes.sql` | `fn_perform_patient_direct_screening(p_patient_id, p_doctor_username)` evaluating active patient medication sets and returning structured findings. | **PASS** |
| **Trigger** | `02_constraints_indexes.sql` | `trg_assessment_findings_count` automatically incrementing `direct_interaction_count` and `multi_hop_candidate_count` on `risk_assessments`. | **PASS** |
| **Transactions & Rollback** | Verified in test block | Verified atomic rollback on error inside `BEGIN ... ROLLBACK;`. | **PASS** |

---

## 4. Neo4j Runtime Status and Test Results

- **Graph Engine:** Neo4j Kernel 5.26.32 Community Edition, running on `bolt://localhost:7687` and `http://localhost:7474`.
- **Status:** **PASS** (100% of Cypher scripts and queries executed without error).

### 4.1 Rubric-Required Graph Features Demonstrated

| Feature Category | Cypher Script | Query / Invariant Evaluated | Result |
|---|---|---|:---:|
| **Schema Constraints** | `01_constraints.cypher` | Uniqueness constraints on `Drug.drug_id` and `Drug.canonical_name`; performance indexes on `pubchem_cid`, `severity_level`, and `evidence_sources`. | **PASS** |
| **Graph Import** | `02_import.cypher` | Idempotent `MERGE` import of 10 `:Drug` nodes and 9 `[:INTERACTS_WITH]` edges with embedded severities and mechanism arrays. | **PASS** (10 nodes, 9 edges) |
| **Direct Interaction Lookup** | `03_queries.cypher` | `MATCH (d:Drug {canonical_name: 'warfarin'})-[r:INTERACTS_WITH]-(partner)` ordered by clinical severity. | **PASS** (3 interacting partners found) |
| **Bounded Multi-Hop Traversal** | `03_queries.cypher` | `MATCH path = (d1:Drug {drug_id: 1})-[r:INTERACTS_WITH*2..3]-(d2:Drug {drug_id: 5})` returning nodes, length, edge severities, and mechanisms. | **PASS** (Found 2-hop bridge via Amiodarone) |
| **3-Hop Deep Traversal** | Ad-hoc query | Bounded 3-hop traversal between Warfarin (1) and Clarithromycin (6). | **PASS** (`warfarin -> amiodarone -> simvastatin -> clarithromycin`) |
| **Bridge Drug Discovery** | `03_queries.cypher` | Intermediary node discovery identifying non-prescribed connector drugs between prescribed regimen members. | **PASS** |
| **NoSQL CRUD (7 Marks Rubric)** | `03_queries.cypher` | **Create:** Insert `test_compound_x` (id: 999) and edge.<br>**Read:** Degree centrality query.<br>**Update:** Set severity and append mechanism category.<br>**Delete:** `DETACH DELETE` cleanup. | **PASS** |

---

## 5. API Endpoints and Services Implemented

The Next.js App Router API was implemented and tested with live requests:

| HTTP Method | Route Path | Description | Input Parameters | Output Summary |
|---|---|---|---|---|
| `GET` | `/api/patients` | Returns all synthetic patients with active medication counts. | None | `{ success: true, data: [...], count: 4 }` |
| `GET` | `/api/patients/:id` | Returns patient details and active prescriptions. | Route param `id` (e.g. `1`) | `{ success: true, data: { patient, active_prescriptions, count } }` |
| `POST` | `/api/patients/:id/analyze-risk` | Executes cross-database risk analysis and persists findings in PostgreSQL. | Route param `id`, JSON body `{ doctor_username, notes }` | Full assessment payload with `assessment_id`, direct findings, candidate pathways, summary metrics, and disclaimer. |
| `GET` | `/api/alerts` | Returns recent risk assessments and associated granular findings. | None | Historical assessment audit trail. |

All endpoints validate parameters, handle non-existent IDs with HTTP 404, reject malformed inputs with HTTP 400, and return structured JSON responses.

---

## 6. End-to-End Integration Test Procedure and Observed Results

Integration test suite [`tests/integration/test_day2_integration.ts`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/tests/integration/test_day2_integration.ts) was executed via `npm run test:integration`:

```text
================================================================================
STARTING DAY 2 CROSS-DATABASE INTEGRATION & END-TO-END TEST SUITE
================================================================================

>>> Test Case 1: Patient Registry & Active Prescriptions
  [PASS] Retrieved synthetic patient registry (>= 4 patients)
  [PASS] Patient 1 (Robert Vance) exists in PostgreSQL
  [PASS] Patient 1 MRN matches SYN-PAT-1001
  [PASS] Synthetic guardrail invariant verified (is_synthetic = true)
  [PASS] Patient 1 has 3 active prescriptions (found 3)
  [PASS] Active regimen includes warfarin
  [PASS] Active regimen includes amiodarone
  [PASS] Active regimen includes simvastatin

>>> Test Case 2: PostgreSQL Direct Pairwise Interaction Discovery
  [PASS] Discovered direct documented interactions (count: 2)
    Direct findings: [ 'warfarin <-> amiodarone (Major)', 'amiodarone <-> simvastatin (Major)' ]
  [PASS] Identified Warfarin <-> Amiodarone direct interaction
  [PASS] Identified Amiodarone <-> Simvastatin direct interaction

>>> Test Case 3: Neo4j Bounded Multi-Hop Pathway Traversal
  [PASS] Discovered multi-hop candidate pathways (count: 1)
  [PASS] Discovered 2-hop candidate bridge: Warfarin -> Amiodarone -> Simvastatin
  [PASS] Amiodarone identified as intermediary bridge node
    Multi-hop candidate pathway: warfarin -> amiodarone -> simvastatin

>>> Test Case 4: End-to-End Risk Analysis Orchestration & Persistence
  [PASS] Assessment persisted with ID 5
  [PASS] Direct findings count matches
  [PASS] Multi-hop candidate count matches
  [PASS] Max severity correctly calculated as Major
  [PASS] Scientific disclaimer included in response payload
  [PASS] Assessment record exists in PostgreSQL risk_assessments
  [PASS] Trigger trg_assessment_findings_count updated direct count to 2
  [PASS] Trigger trg_assessment_findings_count updated multi-hop count to 1

>>> Test Case 5: Edge Case - Patient with < 2 Active Medications
  [PASS] Recognized single active medication
  [PASS] Zero direct interactions returned
  [PASS] Zero multi-hop candidate pathways returned
  [PASS] Clean empty direct findings array
  [PASS] Clean empty multi-hop candidates array
  [PASS] Cleaned up temporary synthetic patient record

>>> Test Case 6: Error Handling & Guardrails
  [PASS] Rejected non-existent patient ID with descriptive error
  [PASS] Error was thrown for non-existent patient ID

================================================================================
ALL INTEGRATION TESTS PASSED: 30/30 checks verified
================================================================================
```

---

## 7. Known Defects, Blockers, and Unverified Functionality

- **Defects:** Zero open defects. The return-type mismatch in `fn_perform_patient_direct_screening` was corrected.
- **Blockers:** Zero blockers. Both database engines are running smoothly in Docker.
- **Unverified Functionality:** None for Day 2. All required SQL and Neo4j features are verified at runtime.
- **Scientific Caveat Preserved:** The backend orchestrator and Cypher services explicitly categorize multi-hop paths as **candidate mechanism pathways** (hypotheses for polypharmacy review) rather than confirmed clinical drug interactions.

---

## 8. Commands to Reproduce and Test

```bash
# 1. Start database containers
docker compose up -d

# 2. Run unit tests (data invariants)
python3 -m unittest discover tests/unit/

# 3. Run cross-database integration tests
npm run test:integration

# 4. Run Next.js development server
npm run dev

# 5. Test API endpoints
curl -s http://localhost:3000/api/patients | jq .
curl -s http://localhost:3000/api/patients/1 | jq .
curl -s -X POST http://localhost:3000/api/patients/1/analyze-risk -H "Content-Type: application/json" -d '{"doctor_username": "dr_sharma"}' | jq .
curl -s http://localhost:3000/api/alerts | jq .
```

---

## 9. Remaining Tasks for Day 3

As specified in the Four-Day Implementation Plan:
1. **Authentication & RBAC:** Implement NextAuth.js session management, password hashing, and role-based route protection for Doctor and Admin roles (`app/login`, `lib/auth`).
2. **Doctor UI Dashboard:** Build the Next.js frontend pages (`app/dashboard`, `app/patients/[id]`, `app/alerts`) enabling clinicians to view medication lists, trigger risk analysis, and explore interactive multi-hop pathway visualizations.
3. **Admin UI:** Build the administration interface (`app/admin`) for user management and audit log reviews.
4. **VIVA Preparation:** Prepare visual demonstrations of SQL recursive CTEs, window functions, and Cypher graph traversals.

---

## 10. Git Status and Hygiene Confirmation

- `git status` summary:
  - Modified: `database/postgres/02_constraints_indexes.sql` (one-line return type fix).
  - Untracked: `docker-compose.yml`, `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `lib/postgres/`, `lib/neo4j/`, `lib/risk-analysis/`, `app/api/`, `tests/integration/`, `docs/reviews/DAY2_RUNTIME_CHECKPOINT.md`, `docs/reviews/DAY2_IMPLEMENTATION_REPORT.md`.
  - Ignored: `.env`, `node_modules/`, `.next/`, `data/raw/*`, `data/processed/*`.
- `git diff --check`: **Exited with code 0 (zero whitespace errors or syntax defects).**
- **Git Hygiene Confirmation:** **No git commit and no git push were performed.** The working tree remains in a clean, inspectable state for the user and teammate.
