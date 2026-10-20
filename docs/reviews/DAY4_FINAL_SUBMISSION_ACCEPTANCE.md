# Day 4 Final Submission Acceptance Audit Report

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course:** PES University — Department of Computer Science & Engineering — DBMS Experiential Learning Level 3 (Aug–Dec 2026)  
**Date of Audit:** October 20, 2026  
**Audit Authority:** Official DBMS Level 3 Evaluation Criteria (`docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`)  
**Overall Readiness Verdict:** **READY FOR HUMAN FINAL ACCEPTANCE** (No schema migration or backend code refactor required)

---

## 1. Executive Summary

This final submission acceptance audit independently verifies the completed codebase, database schemas, graph models, security boundaries, and user interfaces of the *Patient-Specific Multi-Hop Drug Interaction Risk Discovery* system against the official 50-mark PES University DBMS Level 3 Evaluation Criteria.

All 10 relational tables, 11 foreign-key connectors, 2 database-level roles, 6 Cypher graph queries, 9 full-stack Next.js routes, and 67 automated test assertions have been verified in the live containerized runtime (`drug-interaction-postgres` PostgreSQL 16 and `drug-interaction-neo4j` Neo4j 5).

The teammate's final diagrams ([`ER_Diagram_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.drawio) and [`Relational_Schema_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.drawio)) match the implemented SQL DDL and backend application architecture with 100% precision. High-resolution raster (PNG @ 2x) and vector (PDF) exports are complete and verified. **No database migrations or code refactors are required.**

---

## 2. Diagram-to-Implementation Reconciliation Matrix

A source-level comparison was conducted between the final Draw.io diagrams, their vector/raster exports, the companion database design specifications, and the active PostgreSQL DDL:

| Verification Item | Specification / Requirement | Actual Implementation in Code & Schema | Alignment Status | Evidence / Verification Location |
|---|---|---|:---:|---|
| **1. 10 Relational Tables** | All 10 entities appear in both diagrams and SQL schema. | Tables: `drugs`, `drug_source_mappings`, `ddi_pairs`, `ddi_severities`, `ddi_mechanisms`, `patients`, `prescriptions`, `risk_assessments`, `assessment_findings`, `user_accounts`. | **VERIFIED** | `database/postgres/01_schema.sql`<br>`docs/database-design/Relational_Schema_Final.drawio`<br>`docs/database-design/ER_Diagram_Final.drawio` |
| **2. Keys & Constraints** | PKs, FKs, UNIQUE, and CHECK constraints match across all definitions. | All PKs underlined in diagrams. Unique constraints on `drugs.canonical_name`, `patients.mrn`, `user_accounts.username`, and `(drug_a_id, drug_b_id)`. Checks enforce canonical pair ordering (`drug_a_id < drug_b_id`), hop depth `1..3`, and `is_synthetic = TRUE`. | **VERIFIED** | `database/postgres/01_schema.sql`<br>`docs/database-design/RELATIONAL_SCHEMA.md` |
| **3. 11 Foreign-Key Connectors** | Exactly 11 physical FK relationships defined in DDL must match relational diagram arrows. | 1. `drug_source_mappings.drug_id` → `drugs`<br>2. `ddi_pairs.drug_a_id` → `drugs`<br>3. `ddi_pairs.drug_b_id` → `drugs`<br>4. `ddi_severities.pair_id` → `ddi_pairs`<br>5. `ddi_mechanisms.pair_id` → `ddi_pairs`<br>6. `prescriptions.patient_id` → `patients`<br>7. `prescriptions.drug_id` → `drugs`<br>8. `risk_assessments.patient_id` → `patients`<br>9. `assessment_findings.assessment_id` → `risk_assessments`<br>10. `assessment_findings.drug_a_id` → `drugs`<br>11. `assessment_findings.drug_b_id` → `drugs` | **VERIFIED** | Exactly 11 FK connectors (`fk_0` through `fk_10`) mapped in `Relational_Schema_Final.drawio`. Zero unreferenced or missing arrows. |
| **4. Course Chen Notation** | Conceptual ER diagram uses standard Chen notation required by PESU CSE. | Rectangles for entity sets, diamonds for relationship sets, ellipses for attributes, double lines for total participation, underlined text for primary keys. | **VERIFIED** | `docs/database-design/ER_Diagram_Final.drawio`<br>Complies with `docs/course-requirements/ER_MODEL.pdf`. |
| **5. Primary Key Underlining** | All primary key attributes explicitly underlined. | `drug_id`, `mapping_id`, `pair_id`, `severity_id`, `mechanism_id`, `patient_id`, `prescription_id`, `assessment_id`, `finding_id`, `user_id` are underlined in both Chen ERD and relational diagram. | **VERIFIED** | Inspected XML tags `<u><b>...</b></u>` across all PK nodes. |
| **6. Participation & (min, max)** | Structural constraints and cardinality ratios faithfully reflect database rules. | Mapped in `docs/database-design/ER_MODEL.md`. All child entity foreign key connections represent total participation `(1, 1)` with partial parent cardinality `(0, N)`. | **VERIFIED** | `docs/database-design/ER_MODEL.md`<br>`docs/database-design/ER_Diagram_Final.drawio` |
| **7. DDI_PAIR Entity Set** | Interacting drug pairs modeled as a distinct entity rather than a collapsed M:N line. | `DDI_PAIR` is an explicit entity with PK `pair_id`, connected to `DRUG` via roles `Drug A` and `Drug B` (`drug_a_id < drug_b_id`). | **VERIFIED** | Node `e_DDI_PAIR` in `ER_Diagram_Final.drawio` and Table `t_ddi_pairs` in `Relational_Schema_Final.drawio`. |
| **8. Multi-Source Severity Cardinality** | `HAS_SEVERITY` allows multiple severity ratings per pair across distinct datasets. | Structural constraint is `(0, N)` under `UNIQUE(pair_id, source_dataset)`, supporting provenance-separated multi-dataset ratings. | **VERIFIED** | Relationship `r_HAS_SEVERITY` in `ER_Diagram_Final.drawio` and Table `t_ddi_severities` in `Relational_Schema_Final.drawio`. |
| **9. Finding Endpoint Connections** | `FINDING_DRUG_A` and `FINDING_DRUG_B` connect to `DRUG`. | Both relationship diamonds (`r_FINDING_DRUG_A` and `r_FINDING_DRUG_B`) connect between `ASSESSMENT_FINDING` and `DRUG`, correctly reflecting the physical foreign keys `drug_a_id` and `drug_b_id`. | **VERIFIED** | Inspected connector targets in `ER_Diagram_Final.drawio`. |
| **10. Conceptual PERFORMED_BY Link** | `USER_ACCOUNT — PERFORMED_BY — RISK_ASSESSMENT` is clearly distinguished as conceptual. | Rendered as a dashed relationship line with an explicit note: *(dashed PERFORMED_BY is conceptual; no SQL FK)*. `performed_by` is stored as an immutable audit text string to prevent cross-domain locking. | **VERIFIED** | `r_PERFORMED_BY` style: `dashed=1` in `ER_Diagram_Final.drawio`; table note in `Relational_Schema_Final.drawio`. |
| **11. Audit Snapshot Fields** | Severity and mechanism attributes on `assessment_findings` documented as snapshots. | Documented as point-in-time clinical snapshots in both `Relational_Schema_Final.drawio` and `RELATIONAL_SCHEMA.md` to preserve historical integrity. | **VERIFIED** | `docs/database-design/RELATIONAL_SCHEMA.md` Section 2.9. |
| **12. Readability of Exports** | Generated PNG and PDF exports are legible, uncorrupted, and synchronized. | Official Draw.io CLI generated 2x scaled PNGs and cropped vector PDFs. All text blocks, connector lines, and notes are crisp and legible. | **VERIFIED** | `ER_Diagram_Final.png` (1.5 MB), `ER_Diagram_Final.pdf` (157 KB), `Relational_Schema_Final.png` (1.3 MB), `Relational_Schema_Final.pdf` (44 KB). |

---

## 3. Official 50-Mark Evaluation Rubric Reconciliation

The official grading rubric (`docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`) allocates **exactly 50 marks** across 7 primary evaluation categories. The previous Day 4 draft contained an arithmetic error (summing to 55). Below is the reconciled rubric matrix:

```text
========================================================================================
OFFICIAL DBMS LEVEL 3 EVALUATION RUBRIC BREAKDOWN (50 MARKS TOTAL)
========================================================================================
Category 1: Database Design                                                  [ 5 Marks ]
  • ER diagram (Peter Chen notation)                                         :  2 marks
  • Relational schema with keys, relationships, and constraints              :  3 marks
Category 2: Database Creation                                                [ 9 Marks ]
  • SQL database implementation - DDL with constraints                       :  4 marks
  • NoSQL / Vector database creation                                         :  4 marks
  • Technology justification                                                 :  1 mark
Category 3: SQL Operations and Queries                                       [ 8 Marks ]
  • DML operations (INSERT, UPDATE, DELETE)                                  :  4 marks
  • Nested / correlated / Recursive Queries, Join SQL queries                :  4 marks
Category 4: Advanced Database Concepts                                       [ 13 Marks]
  • Advanced SQL concepts (Procedure/function, trigger, CTE)                 :  6 marks
  • NoSQL / Vector feature, CRUD / RUD                                       :  7 marks
Category 5: Web Application and Database Integration                         [ 5 Marks ]
  • Next.js interface                                                        :  3 marks
  • Backend / API and database integration                                   :  2 marks
Category 6: Authentication and Authorization                                 [ 4 Marks ]
  • Authentication implementation (frontend, >= 2 roles, DB-level RBAC)      :  4 marks
Category 7: Documentation, Git/GitHub, Demonstration, Testing & Originality  [ 6 Marks ]
  • Documentation, Git/GitHub                                                :  2 marks
  • Originality, individual contribution, Modification / Viva                :  4 marks
========================================================================================
TOTAL EVALUATION MARKS                                                       [ 50 Marks]
========================================================================================
```

### Rubric Implementation & Verification Audit

| Category | Max Marks | Implementation Evidence & Verification Artifacts | Status |
|---|:---:|---|:---:|
| **1. Database Design** | **5** | • `docs/database-design/ER_Diagram_Final.drawio` & `.pdf` (Chen notation, 10 entities, 12 relationships).<br>• `docs/database-design/Relational_Schema_Final.drawio` & `RELATIONAL_SCHEMA.md` (all 10 tables, 11 FKs, domain checks). | **VERIFIED** |
| **2. Database Creation** | **9** | • `database/postgres/01_schema.sql` (10 tables with SERIAL/BIGSERIAL, UNIQUE, CHECK).<br>• `database/neo4j/01_constraints.cypher` & `02_import.cypher` (Neo4j 5 property graph with uniqueness constraints).<br>• `docs/database-design/TECHNOLOGY_JUSTIFICATION.md` (Index-free adjacency vs relational self-join explosion defense). | **VERIFIED** |
| **3. SQL Operations & Queries** | **8** | • `database/postgres/03_seed_synthetic.sql` (DML inserts across all tables).<br>• `database/postgres/04_required_queries.sql` (multi-table joins, correlated subqueries, `DENSE_RANK()` window functions, recursive graph traversal CTE). | **VERIFIED** |
| **4. Advanced Database Concepts** | **13** | • `database/postgres/02_constraints_indexes.sql`: Stored function `fn_perform_patient_direct_screening()`, event trigger `trg_assessment_findings_count` firing `fn_update_assessment_counts()` with `SECURITY DEFINER SET search_path = public, pg_temp`.<br>• `database/neo4j/03_queries.cypher`: 1-hop direct, 2-hop bridge, and 3-hop bounded traversals; NoSQL CRUD operations demonstration. | **VERIFIED** |
| **5. Web Application & Integration** | **5** | • Next.js 14 App Router full-stack web application (`app/`).<br>• Dual-database orchestrator (`lib/risk-analysis/orchestrator.ts`) coordinating PostgreSQL and Neo4j queries.<br>• Clean production build (`npm run build`, 9/9 pages generated). | **VERIFIED** |
| **6. Authentication & Authorization** | **4** | • Salted bcrypt password hashing (`lib/auth/auth-service.ts`).<br>• Cryptographically signed HttpOnly JWT session cookies (`lib/auth/jwt.ts`).<br>• Route protection middleware (`middleware.ts`).<br>• PostgreSQL database-level RBAC (`database/postgres/05_roles_rbac.sql`) with dedicated login users (`app_doctor_user` vs `app_admin_user`) and explicit table-level permission restrictions (`REVOKE ALL ON TABLE user_accounts FROM role_doctor`). | **VERIFIED** |
| **7. Documentation, Git & Originality** | **6** | • Comprehensive documentation index (`docs/README.md`) and data dictionary (`DATA_DICTIONARY.md`).<br>• Source provenance and SHA-256 manifest (`data/manifests/source_manifest.csv`).<br>• 67 passing automated test assertions.<br>• Defensible viva demonstration script (`docs/reviews/FINAL_VIVA_DEMO_GUIDE.md`). | **VERIFIED** |

---

## 4. Security & Least-Privilege Verification

1. **Role-Specific Connection Pools:**
   - Clinician operations (`patient-service.ts`, `/api/patients`, `/api/patients/[id]/analyze-risk`, `/api/alerts`) execute via `app_doctor_user` (`role_doctor`).
   - Administrative operations (`auth-service.ts`, `/api/admin/users`) execute via `app_admin_user` (`role_admin`).
   - Zero clinical operations connect using the superuser `postgres`.
2. **Database Engine Privilege Hardening:**
   - Attempting `SELECT * FROM user_accounts` as `app_doctor_user` yields SQL error `42501 permission denied for table user_accounts`.
   - Attempting `DELETE FROM patients` as `app_doctor_user` yields SQL error `42501 permission denied for table patients`.
3. **Trigger Security & Safe Search Path:**
   - Trigger function `fn_update_assessment_counts()` is configured with `SECURITY DEFINER SET search_path = public, pg_temp`.
   - The trigger runs with owner privileges to increment summary counters on `risk_assessments` while preserving the doctor's read-only/append-only boundary.
4. **Session Authentication & Identity Attribution:**
   - Clinician identity in assessments is derived directly from the authenticated JWT session payload (`session.username`), completely ignoring any client-supplied spoofed parameters.
   - Tampered JWT tokens fail signature verification immediately.

---

## 5. Regression & Test Suite Results

All verification suites executed cleanly with zero errors:

```text
================================================================================
REGRESSION TEST SUITE EXECUTION SUMMARY
================================================================================
1. Docker Compose Status       : PostgreSQL 16 (healthy), Neo4j 5 (healthy)
2. Auth & RBAC Suite           : 26 / 26 PASS  (npm run test:auth)
3. Cross-Database Integration  : 30 / 30 PASS  (npm run test:integration)
4. Unit Invariant Test Suite   : 11 / 11 PASS  (python3 -m unittest discover tests/unit/)
5. TypeScript Static Analysis  : 0 ERRORS      (npx tsc --noEmit)
6. Next.js Production Build    : 9 / 9 PAGES   (npm run build)
7. Git Diff Syntax Check       : PASS          (git diff --check)
================================================================================
TOTAL AUTOMATED TEST ASSERTIONS: 67 / 67 PASSED (100% SUCCESS RATE)
================================================================================
```

---

## 6. Repository Hygiene & Submission Integrity

- **Restricted Datasets:** Raw bulk CSV files from DDInter and MecDDI remain Git-ignored under `data/raw/` and `data/processed/` per CC BY-NC-SA 4.0 and academic terms.
- **Secrets & Credentials:** No passwords, API keys, `.env`, or `.env.local` files are tracked. Only `.env.example` is committed.
- **Synthetic Patient Boundary:** 100% of patient records in `03_seed_synthetic.sql` are synthetic, guaranteed by the table constraint `CHECK (is_synthetic = TRUE)`.
- **Git State:** Working tree is clean and uncommitted. Zero unauthorized pushes or commits were executed.

---

## 7. Submission Readiness Verdict

**Verdict:** **READY FOR HUMAN FINAL ACCEPTANCE**

No code modifications, schema migrations, or diagram regenerations are required. The repository is in an optimal, reproducible state for final grading and viva evaluation.
