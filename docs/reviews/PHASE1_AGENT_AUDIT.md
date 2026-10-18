# Phase 1 — Independent Agent Self-Audit, Corrections, and Pre-Handoff Verification

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course Context:** PES University — DBMS Experiential Learning Level 3 (August–December 2026)  
**Date of Audit:** October 18, 2026  
**Auditor:** Antigravity Autonomous Coding Agent  
**Overall Phase 1 Status:** **READY FOR HUMAN REVIEW** (Static Design, Preprocessing Pipeline, Data Integrity, and Invariant Tests Verified; Database Runtime Execution Marked `NOT VERIFIED` due to lack of local database services in agent environment).

---

## 1. Executive Summary

This independent self-audit rigorously inspects all artifacts produced in Phase 1 of the *Patient-Specific Multi-Hop Drug Interaction Risk Discovery* project. The evaluation strictly abides by the authority hierarchy:
1. **Grading Authority:** PES University DBMS Level 3 Rubric (50 marks).
2. **Execution Contract:** Four-Day Implementation Plan (`docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md`).
3. **Conceptual Vision:** Project Pitch (`docs/project-plan/PROJECT_PITCH.pdf`).
4. **ER Modeling Authority:** PES University CSE Course Lecture Material (`docs/course-requirements/ER_MODEL.pdf`).

### Key Audit Findings
- **Data Integrity & Preprocessing:** The end-to-end preprocessing pipeline was audited, hardened, and executed against 8 raw DDInter CSVs (222,383 rows) and 9 raw MecDDI CSVs (197,305 mechanism rows; 178,406 unique pairs). The pipeline generated 1,968 canonical drugs, 3,861 source mappings, 219,040 canonical pairs, 160,235 severity records, and 182,486 mechanism records. All data invariants (ordering `drug_a_id < drug_b_id`, pair uniqueness, referential integrity, and domain bounds) were strictly validated with 0 errors.
- **Defect Resolution in Entity Resolution:** `build_drug_mapping.py` was identified as having a potential vulnerability to silently overwrite dictionary keys if colliding normalized drug names occurred within a source. Although current data contains zero colliding names, the script was hardened to use `defaultdict(list)`, detect collisions, output an explicit reviewable exception report (`mapping_ambiguity_exceptions.csv`), and prevent automatic merging of ambiguous entities.
- **Missing File Error Handling:** `prepare_ddinter.py`, `prepare_mecddi.py`, and `run_all.py` were hardened with explicit `FileNotFoundError` and `RuntimeError` checks to ensure missing inputs or validation failures immediately halt execution.
- **Course-Specific Chen + (Min, Max) ER Diagram:** Following PES University course slides `ER_MODEL.pdf` (Dr. Nagasundari S, CSE Dept), the ER diagram was generated in full Chen notation with `(min, max)` structural constraints across all 10 entities, and exported across all three synchronized formats (`.drawio`, `.pdf`, `.png`). No unsupported enzyme/receptor nodes were fabricated.
- **Schema & DDL Reconciliation:** All 10 relational tables were reconciled line-by-line across the ERD, Relational Schema, Data Dictionary, Normalization proofs, and PostgreSQL DDL. Every primary key, foreign key, nullability constraint, check constraint, and unique constraint matches.
- **Normalization Rigor:** Candidate keys, functional dependencies, BCNF proofs, and 4NF decomposition proofs were validated. Claims of BCNF and 4NF were confirmed defensible and accurate.
- **Git & Licensing Hygiene:** Raw and processed biomedical datasets are completely untracked in Git and protected by `.gitignore`. DDInter is documented under CC BY-NC-SA 4.0; MecDDI redistribution rights remain unresolved and conservatively held locally.
- **Runtime Verification Status:** Neither PostgreSQL nor Neo4j daemon is provisioned in the agent shell environment. As required by project rules, static review is confirmed PASS, while runtime testing is honestly logged as `NOT VERIFIED (Static Review Only)`.

---

## 2. Initial Repository Baseline and Git Status

Before initiating the audit and applying fixes, the Git baseline was captured:
- **Branch:** `main` (up to date with `origin/main`)
- **Git Status:** 
  - Tracked modified: `.gitignore`, `README.md`, `docs/README.md`.
  - Untracked artifacts: `database/`, `data/manifests/`, `docs/database-design/`, `docs/data-dictionary/`, `docs/course-requirements/ER_MODEL.pdf`, `scripts/preprocessing/`, `tests/unit/`.
- **Git-Ignored Paths:** Verified that `data/raw/*`, `data/processed/*`, `data/synthetic/*` are completely ignored by `.gitignore`.
- **Tracked Data Check:** `git ls-files data/` confirmed that zero raw or processed CSV files are tracked. Only `.gitkeep` markers and markdown documentation exist in Git.
- **Git Diff Hygiene:** Post-fix validation with `git diff --check` executed with code 0 (all trailing whitespaces eliminated). No commits or pushes were made.

---

## 3. Requirements and Rubric Traceability Matrix

| Rubric Component | Max Marks | Required Artifact / Feature | Project Implementation Location | Evidence Inspected / Command Executed | Audit Status | Corrective Action / Human Decision |
|---|:---:|---|---|---|:---:|---|
| **1. ER Diagram** | 5 | Conceptual ERD using course-taught notation, identifying entities, attributes, primary keys, relationships, cardinality, and participation constraints. | `docs/database-design/ER_DIAGRAM.drawio`<br>`docs/database-design/ER_DIAGRAM.pdf`<br>`docs/database-design/ER_DIAGRAM.png` | Inspected course lecture slides `ER_MODEL.pdf`. Verified Chen notation (rectangles, diamonds, ovals, underlined keys) and `(min, max)` constraints for 10 entities. Verified all 3 synchronized exports. | **PASS** | Human teammate to visually review diagram in Draw.io. |
| **2. Relational Schema & Constraints** | 5 | Relational model, tables, candidate keys, foreign keys, not null, check constraints, default values. | `docs/database-design/RELATIONAL_SCHEMA.md`<br>`docs/database-design/DATA_DICTIONARY.md` | Inspected all 10 relation definitions, domain specifications, referential actions, and candidate keys. Checked against DDL. | **PASS** | None. Documented accurately. |
| **3. Normalization (BCNF / 4NF)** | 5 | Formal functional dependencies, candidate key derivation, BCNF decomposition proofs, multivalued dependency (4NF) analysis. | `docs/database-design/NORMALIZATION.md` | Verified FDs for each table. Checked that all LHS determinants are superkeys (BCNF). Verified separation of independent MVDs into `ddi_severities` and `ddi_mechanisms` (4NF). | **PASS** | Claims confirmed mathematically defensible. |
| **4. PostgreSQL DDL Implementation** | 5 | Executable PostgreSQL DDL with domains, keys, check constraints, referential actions, indexes. | `database/postgres/01_schema.sql`<br>`database/postgres/02_constraints_indexes.sql` | Statically validated syntax for 10 tables, pair check `drug_a_id < drug_b_id`, pair unique constraint, role checks, B-tree & composite indexes. | **PASS** *(Static)*<br>**NOT VERIFIED** *(Runtime)* | Teammate to run DDL against PostgreSQL 16+ instance. |
| **5. Seed Data & Demonstrations** | 4 | Representative demonstration data satisfying referential integrity, testing edge cases and multi-hop scenarios. | `database/postgres/03_seed_synthetic.sql` | Verified 10 canonical drugs, 9 interaction pairs, 4 synthetic patients, 11 active prescriptions, 2 roles, multi-hop pathways. | **PASS** *(Static)*<br>**NOT VERIFIED** *(Runtime)* | Seed data verified static compliant; runtime verification pending DB container. |
| **6. Relational Queries (Joins, Aggregations, CTEs)** | 6 | Basic queries, multi-table joins, nested/correlated subqueries, window functions, recursive CTEs. | `database/postgres/04_required_queries.sql` | Inspected 7 required query categories including correlated subqueries for polypharmacy risk, window ranking, and recursive CTE for 2-hop traversal. | **PASS** *(Static)*<br>**NOT VERIFIED** *(Runtime)* | Verified SQL syntax and semantics statically. |
| **7. Stored Procedures & Triggers** | 5 | Procedural business logic and automated constraint enforcement. | `database/postgres/02_constraints_indexes.sql` | Inspected `trg_assessment_findings_count` (dynamic findings counter) and `fn_perform_patient_direct_screening` (screening engine). | **PASS** *(Static)*<br>**NOT VERIFIED** *(Runtime)* | Execution requires PostgreSQL runtime. |
| **8. NoSQL Database Justification & Graph Modeling** | 5 | Technological justification, comparison of Relational vs Graph, Neo4j schema design. | `docs/database-design/TECHNOLOGY_JUSTIFICATION.md`<br>`docs/database-design/GRAPH_SCHEMA.md` | Inspected complexity comparison ($O(b^k)$ relational join explosion vs index-free adjacency $O(d^k)$), Cypher schema, property graph model. | **PASS** | None. Clear justification grounded in benchmark literature. |
| **9. Neo4j Constraints & Data Ingestion** | 5 | Idempotent Cypher DDL, node/relationship constraints, bulk CSV import scripts. | `database/neo4j/01_constraints.cypher`<br>`database/neo4j/02_import.cypher` | Inspected Cypher uniqueness constraints (`Drug.drug_id`), APOC/periodic iterate import scripts, bidirectional edge traversal modeling. | **PASS** *(Static)*<br>**NOT VERIFIED** *(Runtime)* | Execution requires Neo4j 5+ instance. |
| **10. Graph Traversal & CRUD Queries** | 5 | 1-hop direct, 2-hop candidate pathway, 3-hop bounded traversals, path ranking, CRUD operations. | `database/neo4j/03_queries.cypher` | Inspected Cypher path traversals (`(d1)-[r1:INTERACTS_WITH]-(d2)-[r2:INTERACTS_WITH]-(d3)`), node exclusion, property aggregation, CRUD queries. | **PASS** *(Static)*<br>**NOT VERIFIED** *(Runtime)* | Execution requires Neo4j runtime. |
| **Total Marks Evaluated** | **50** | Comprehensive Phase 1 Design, Schemas, Pipeline, Invariant Tests, and Documentation. | Repository-wide | Executed test suite (11 unit tests passed); ran full preprocessing pipeline; verified 0 git diff errors. | **READY FOR HUMAN REVIEW** | Teammate to verify runtime execution in Phase 2 environment. |

---

## 4. Source Data Audit and Count Reconciliation

The source data audit was conducted independently by executing `scripts/preprocessing/inspect_sources.py` and reviewing raw CSV contents.

### 4.1 DDInter Source Audit (8 Files)
- **Directory:** `data/raw/ddinter/`
- **Files Audited:** 8 files corresponding to ATC classification codes (`A`, `B`, `D`, `H`, `L`, `P`, `R`, `V`).
- **Schema:** 5 columns: `DDInterID_A`, `Drug_A`, `DDInterID_B`, `Drug_B`, `Level`.
- **Total Raw Rows:** 222,383 rows.
- **Unique Drugs Extracted:** 1,939 unique drug entities.
- **Unique Unordered Pairs:** 160,235 unique pairs.
- **Cross-ATC Duplicates:** Multiple pairs appear across ATC categories; however, zero pairs had conflicting severity levels.
- **Severity Domain Distribution (Raw):**
  - `Moderate`: 127,330 appearances (57.26%)
  - `Unknown`: 47,152 appearances (21.20%)
  - `Major`: 31,582 appearances (14.20%)
  - `Minor`: 16,319 appearances (7.34%)
  - *Conflicting Severity Levels:* **0** (Invariant verified).

### 4.2 MecDDI Source Audit (9 Files)
- **Directory:** `data/raw/mecddi/`
- **Master Drug Info (`Drug General Information.csv`):** 1,922 rows, 13 columns.
  - Unique MecDDI IDs: 1,922.
  - Non-empty SMILES: 1,894 (98.5%).
  - Non-empty InChIKey: 1,894 (98.5%).
  - Non-empty PubChem CID: 1,894 (98.5%).
- **Master Interaction Pairs (`Drug-Drug-Interaction-Pair.csv`):** 178,406 rows, 4 columns.
  - Unique unordered pairs: 178,406 unique pairs.
- **Mechanism Category Observations (7 Files):**
  1. `Affected cellular transport.csv`: 4,983 rows
  2. `Affected excretion pathways.csv`: 1,381 rows
  3. `Affected gastrointestinal absorption.csv`: 5,207 rows
  4. `Affected intra_extra-hepatic metabolism.csv`: 40,645 rows (CSV column uses slash: `Affected intra/extra-hepatic metabolism`)
  5. `Affected organization distribution.csv`: 1,110 rows
  6. `Pharmacodynamic additive effects.csv`: 121,291 rows
  7. `Pharmacodynamic antagonistic effects.csv`: 22,688 rows
  - **Total Raw Mechanism Records:** 197,305 rows.
  - **Pairs with Mechanism Annotations:** 178,406 unique pairs.
  - **Multi-Category Interactions:** 17,215 pairs exhibit 2 mechanism categories; 842 pairs exhibit 3 mechanism categories.
  - **Enzyme/Receptor Finding:** Neither MecDDI nor DDInter supplies specific CYP enzyme IDs, receptor gene names, or clinical outcome scores. The dataset provides macroscopic mechanism categories. Consequently, the schema and graph intentionally do not fabricate enzyme nodes.

### 4.3 Cross-Source Reconciliation and Output Counts

| Metric | Raw Audit Count | Preprocessing Output | Invariant Status |
|---|:---:|:---:|:---:|
| **Unique DDInter Drugs** | 1,939 | 1,939 | Matched |
| **Unique MecDDI Master Drugs** | 1,922 | 1,922 | Matched |
| **Exact Normalized Name Intersect** | 1,893 | 1,893 | Matched (1-to-1 exact) |
| **MecDDI Source-Exclusive Drugs** | 29 | 29 | Matched |
| **DDInter Source-Exclusive Drugs** | 46 | 46 | Matched |
| **Total Canonical Drugs** | 1,893 + 29 + 46 = **1,968** | **1,968** | Matched |
| **Total Source Mappings** | (1,893 × 2) + 29 + 46 = **3,861** | **3,861** | Matched |
| **DDInter Unique Pairs** | 160,235 | 160,235 | Matched |
| **MecDDI Unique Pairs** | 178,406 | 178,406 | Matched |
| **Overlapping Pairs (Both Sources)** | 119,601 | 119,601 | Matched |
| **Unified Canonical Pairs** | 160,235 + 178,406 - 119,601 = **219,040** | **219,040** | Matched |
| **Canonical Severity Records** | 160,235 | 160,235 | Matched |
| **Canonical Mechanism Records** | 182,486 (deduplicated) | 182,486 | Matched |
| **Colliding / Ambiguous Normalized Names** | 0 | 0 | Verified; exception report produced |

---

## 5. Licensing and Data Tracking Audit

### 5.1 License Analysis
1. **DDInter:** Documented in literature and website under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. Academic and educational experiential learning projects fall squarely under non-commercial educational use. Derivative data must be licensed under compatible terms.
2. **MecDDI:** Academic dataset sourced from original publication (Bioinformatics / BMC). Redistribution rights remain unresolved in the open-source context.
3. **Licensing Decision:** In accordance with project instructions, **neither raw CSVs nor derived processed CSVs are committed to Git**. Both datasets are held strictly in local untracked storage.

### 5.2 Git Tracking Verification
- Executed `git ls-files data/`:
  - `data/README.md` (Tracked)
  - `data/manifests/data_sources.md` (Tracked)
  - `data/manifests/source_manifest.csv` (Tracked)
  - `.gitkeep` files in `data/processed/`, `data/raw/`, `data/samples/`, `data/synthetic/` (Tracked)
  - Raw and processed bulk datasets: **0 files tracked** (100% compliant).

---

## 6. Conceptual ER Diagram Audit Against Course Materials

### 6.1 Lecture Material Reference
Inspected [`docs/course-requirements/ER_MODEL.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/ER_MODEL.pdf) authored by Dr. Nagasundari S, Department of Computer Science & Engineering, PES University.

### 6.2 Course Notation Standard
The PES University course material establishes the following visual standards:
1. **Entities:** Rectangles containing the entity name in uppercase.
2. **Weak Entities:** Double rectangles (used only when an entity cannot be identified without an owner entity's primary key; in our design, all entities possess surrogate or natural primary keys).
3. **Attributes:** Ovals connected to their entity with straight lines. Key attributes are strictly **underlined**. Derived attributes are dashed ovals. Multivalued attributes are double ovals.
4. **Relationships:** Diamond shapes connected to participating entities.
5. **Structural Constraints (Cardinality & Participation):** Explicit `(min, max)` notation annotated along the connecting edges. E.g., `(1, 1)` denotes total participation with a maximum of 1; `(0, N)` denotes partial participation with arbitrary maximum cardinality.

### 6.3 Audit of Current Diagram
The diagram generation script (`scripts/preprocessing/generate_chen_er_diagram.py`) was audited:
- **Entities Modeled (10):** `DRUG`, `DRUG_SOURCE_MAPPING`, `DDI_PAIR`, `DDI_SEVERITY`, `DDI_MECHANISM`, `USER_ACCOUNT`, `PATIENT`, `PRESCRIPTION`, `RISK_ASSESSMENT`, `ASSESSMENT_FINDING`.
- **Relationships Modeled (9):**
  - `MAPPED_TO`: `DRUG (1, N)` — `(1, 1) DRUG_SOURCE_MAPPING`
  - `INTERACTS_A`: `DRUG (0, N)` — `(1, 1) DDI_PAIR`
  - `INTERACTS_B`: `DRUG (0, N)` — `(1, 1) DDI_PAIR`
  - `EVIDENCED_BY_SEV`: `DDI_PAIR (0, N)` — `(1, 1) DDI_SEVERITY`
  - `EVIDENCED_BY_MECH`: `DDI_PAIR (0, N)` — `(1, 1) DDI_MECHANISM`
  - `RECEIVES`: `PATIENT (0, N)` — `(1, 1) PRESCRIPTION`
  - `PRESCRIBED`: `DRUG (0, N)` — `(1, 1) PRESCRIPTION`
  - `UNDERGOES`: `PATIENT (0, N)` — `(1, 1) RISK_ASSESSMENT`
  - `PRODUCED`: `RISK_ASSESSMENT (1, 1)` — `(0, N) ASSESSMENT_FINDING`
  - `IDENTIFIED`: `DDI_PAIR (0, N)` — `(1, 1) ASSESSMENT_FINDING`
  - `PERFORMED_BY`: `USER_ACCOUNT (0, N)` — `(1, 1) RISK_ASSESSMENT`
- **Output Formats Verified:**
  1. `docs/database-design/ER_DIAGRAM.drawio`: Valid diagrams.net XML containing 146 nodes and connectors.
  2. `docs/database-design/ER_DIAGRAM.pdf`: High-resolution vector PDF export.
  3. `docs/database-design/ER_DIAGRAM.png`: 150 DPI raster export.
- **Biomedical Integrity:** Verified that no fictitious enzyme/receptor entities are depicted. The diagram strictly models documented macroscopic interaction pairs and mechanism evidence.

---

## 7. ERD, Relational Schema, Data Dictionary, and PostgreSQL DDL Reconciliation Matrix

Each of the 10 database tables was compared across all four design artifacts.

| # | Table / Entity | ERD Representation | Relational Schema Representation | PostgreSQL DDL (`01_schema.sql`) | Primary Key Agreement | Foreign Keys & Actions | Nullability & Domains | Constraints & Invariants | Reconciliation Result |
|:---:|---|---|---|---|:---:|---|---|---|:---:|
| 1 | `drugs` | Entity `DRUG` with attributes `drug_id` (PK), `canonical_name`, `smiles`, `inchikey`, `pubchem_cid`, `drug_type`, `therapeutic_class`. | Table `drugs` with matching 7 attributes. | `CREATE TABLE drugs (...)` | `drug_id INT GENERATED ALWAYS AS IDENTITY` | None. | `canonical_name VARCHAR(255) NOT NULL`. | `UNIQUE (canonical_name)`. | **PASS** (100% Match) |
| 2 | `drug_source_mappings` | Entity `DRUG_SOURCE_MAPPING` with PK `mapping_id`, FK `drug_id`, `source_name`, `source_drug_id`, `source_drug_name`, `match_method`. | Table `drug_source_mappings` with matching 6 attributes. | `CREATE TABLE drug_source_mappings (...)` | `mapping_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (drug_id) REFERENCES drugs(drug_id) ON DELETE CASCADE`. | `source_name VARCHAR(50) NOT NULL`, `source_drug_id VARCHAR(100) NOT NULL`. | `UNIQUE (source_name, source_drug_id)`, `CHECK (source_name IN ('DDInter', 'MecDDI'))`. | **PASS** (100% Match) |
| 3 | `ddi_pairs` | Entity `DDI_PAIR` with PK `pair_id`, endpoints `drug_a_id`, `drug_b_id`. | Table `ddi_pairs` with matching attributes. | `CREATE TABLE ddi_pairs (...)` | `pair_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (drug_a_id) REFERENCES drugs(drug_id) ON DELETE RESTRICT`, `FOREIGN KEY (drug_b_id) REFERENCES drugs(drug_id) ON DELETE RESTRICT`. | `drug_a_id NOT NULL`, `drug_b_id NOT NULL`. | `CHECK (drug_a_id < drug_b_id)`, `UNIQUE (drug_a_id, drug_b_id)`. | **PASS** (100% Match) |
| 4 | `ddi_severities` | Entity `DDI_SEVERITY` with PK `severity_id`, FK `pair_id`, `severity_level`, `source_dataset`, `source_atc_codes`. | Table `ddi_severities` with matching 5 attributes. | `CREATE TABLE ddi_severities (...)` | `severity_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (pair_id) REFERENCES ddi_pairs(pair_id) ON DELETE CASCADE`. | `severity_level VARCHAR(20) NOT NULL`. | `CHECK (severity_level IN ('Major', 'Moderate', 'Minor', 'Unknown'))`, `UNIQUE (pair_id, source_dataset)`. | **PASS** (100% Match) |
| 5 | `ddi_mechanisms` | Entity `DDI_MECHANISM` with PK `mechanism_id`, FK `pair_id`, `mechanism_category`, `source_dataset`. | Table `ddi_mechanisms` with matching 4 attributes. | `CREATE TABLE ddi_mechanisms (...)` | `mechanism_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (pair_id) REFERENCES ddi_pairs(pair_id) ON DELETE CASCADE`. | `mechanism_category VARCHAR(100) NOT NULL`. | `CHECK (mechanism_category IN (7 categories))`, `UNIQUE (pair_id, mechanism_category, source_dataset)`. | **PASS** (100% Match) |
| 6 | `user_accounts` | Entity `USER_ACCOUNT` with PK `user_id`, `username`, `role`, `full_name`, `email`, `created_at`. | Table `user_accounts` with matching 6 attributes. | `CREATE TABLE user_accounts (...)` | `user_id INT GENERATED ALWAYS AS IDENTITY` | None. | `username NOT NULL`, `role NOT NULL`. | `CHECK (role IN ('Doctor', 'Admin'))`, `UNIQUE (username)`. | **PASS** (100% Match) |
| 7 | `patients` | Entity `PATIENT` with PK `patient_id`, `mrn`, `full_name`, `date_of_birth`, `gender`, `is_synthetic`. | Table `patients` with matching 6 attributes. | `CREATE TABLE patients (...)` | `patient_id INT GENERATED ALWAYS AS IDENTITY` | None. | `mrn NOT NULL`, `is_synthetic NOT NULL`. | `CHECK (is_synthetic = TRUE)`, `CHECK (gender IN ('Male', 'Female', 'Other', 'Unknown'))`, `UNIQUE (mrn)`. | **PASS** (100% Match) |
| 8 | `prescriptions` | Entity `PRESCRIPTION` with PK `prescription_id`, FK `patient_id`, FK `drug_id`, FK `prescribed_by_user_id`, dosage, dates, status. | Table `prescriptions` with matching 9 attributes. | `CREATE TABLE prescriptions (...)` | `prescription_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE`, `FOREIGN KEY (drug_id) REFERENCES drugs(drug_id) ON DELETE RESTRICT`, `FOREIGN KEY (prescribed_by_user_id) REFERENCES user_accounts(user_id)`. | `status NOT NULL`. | `CHECK (status IN ('Active', 'Discontinued', 'Completed'))`, `CHECK (end_date IS NULL OR end_date >= start_date)`. | **PASS** (100% Match) |
| 9 | `risk_assessments` | Entity `RISK_ASSESSMENT` with PK `assessment_id`, FK `patient_id`, FK `assessed_by_user_id`, `max_severity_found`, `finding_count`. | Table `risk_assessments` with matching 7 attributes. | `CREATE TABLE risk_assessments (...)` | `assessment_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE`, `FOREIGN KEY (assessed_by_user_id) REFERENCES user_accounts(user_id)`. | `assessment_timestamp NOT NULL`. | `CHECK (max_severity_found IN ('Major', 'Moderate', 'Minor', 'Unknown', 'None'))`. | **PASS** (100% Match) |
| 10 | `assessment_findings` | Entity `ASSESSMENT_FINDING` with PK `finding_id`, FK `assessment_id`, FK `pair_id`, `path_length`, `explanation`. | Table `assessment_findings` with matching 6 attributes. | `CREATE TABLE assessment_findings (...)` | `finding_id INT GENERATED ALWAYS AS IDENTITY` | `FOREIGN KEY (assessment_id) REFERENCES risk_assessments(assessment_id) ON DELETE CASCADE`, `FOREIGN KEY (pair_id) REFERENCES ddi_pairs(pair_id) ON DELETE RESTRICT`. | `path_length NOT NULL`. | `CHECK (path_length IN (1, 2, 3))`, `UNIQUE (assessment_id, pair_id)`. | **PASS** (100% Match) |

---

## 8. Normalization Review (BCNF and 4NF Claims)

The claims documented in `docs/database-design/NORMALIZATION.md` were evaluated against the SQL DDL:

### 8.1 Functional Dependencies and BCNF
- **Criterion:** A relation $R$ is in Boyce-Codd Normal Form (BCNF) if for every non-trivial functional dependency $X \rightarrow Y$, $X$ is a superkey of $R$.
- **Audit:**
  - `drugs`: Candidate key is `drug_id` (and alternate key `canonical_name`). All attributes depend exclusively on the superkey. **Holds BCNF**.
  - `drug_source_mappings`: Candidate keys are `mapping_id` and `(source_name, source_drug_id)`. Every determinant is a superkey. **Holds BCNF**.
  - `ddi_pairs`: Candidate keys are `pair_id` and `(drug_a_id, drug_b_id)`. No non-key determinants exist. **Holds BCNF**.
  - `patients`, `prescriptions`, `risk_assessments`, `user_accounts`: Each table has a single surrogate primary key and natural unique constraints. All determinants are superkeys. **Holds BCNF**.

### 8.2 Multivalued Dependencies and 4NF
- **Problem Statement:** A drug interaction pair exhibits two independent multivalued properties:
  1. $\text{pair\_id} \twoheadrightarrow \text{severity\_evidence}$ (from DDInter, multi-ATC)
  2. $\text{pair\_id} \twoheadrightarrow \text{mechanism\_category}$ (from MecDDI, up to 3 categories)
- **4NF Violation in a Denormalized Table:** If modeled in a single table `ddi_pair_evidence(pair_id, severity_level, mechanism_category)`, representing a pair with 2 severities and 3 mechanisms would require $2 \times 3 = 6$ rows, introducing spurious tuples and redundancy.
- **Decomposition:** The schema cleanly decomposes the relationship into two distinct projection tables:
  - `ddi_severities(severity_id, pair_id, severity_level, source_dataset, source_atc_codes)`
  - `ddi_mechanisms(mechanism_id, pair_id, mechanism_category, source_dataset)`
- **Conclusion:** Both decomposed tables satisfy 4NF. The normalization proofs in `docs/database-design/NORMALIZATION.md` are mathematically sound and substantiated by the DDL implementation.

---

## 9. Preprocessing Pipeline and Unit Test Execution

### 9.1 Pipeline Execution Evidence
The full preprocessing pipeline was executed from the repository root:
```bash
PYTHONPATH=scripts/preprocessing python3 scripts/preprocessing/run_all.py
```
- **Exit Code:** `0`
- **Elapsed Time:** `51.84 seconds`
- **Output Validation Report (`data/processed/validation_report.json`):**
  - `status`: `"PASSED"`
  - `total_canonical_drugs`: `1,968`
  - `total_canonical_pairs`: `219,040`
  - `total_severity_records`: `160,235`
  - `total_mechanism_records`: `182,486`
  - `total_source_mappings`: `3,861`
  - All 11 automated checks evaluated to `PASS`.

### 9.2 Unit Test Execution Evidence
The unit test suite was expanded and executed via Python's standard `unittest` discovery:
```bash
python3 -m unittest discover tests/unit/
```
- **Exit Code:** `0`
- **Ran:** `11 tests in 0.365s`
- **Status:** `OK`
- **Test Inventory:**
  1. `test_canonical_pair_ordering`: Verified `drug_a_id < drug_b_id` and self-interaction exception.
  2. `test_no_duplicate_canonical_pairs`: Verified reverse pairs `(b, a)` resolve to identical canonical key.
  3. `test_pair_endpoint_referential_integrity`: Verified endpoints are strict subsets of registered drugs.
  4. `test_name_normalization_idempotence`: Verified determinism, lowercasing, whitespace trimming, and null handling.
  5. `test_severity_levels_domain`: Verified domain membership for `'Major', 'Moderate', 'Minor', 'Unknown'`.
  6. `test_mechanism_categories_domain`: Verified domain membership across all 7 recognized categories.
  7. `test_unique_source_mappings`: Verified uniqueness of `(source_name, source_drug_id)`.
  8. `test_ambiguous_normalized_names_detection`: Verified detection and logging of colliding names.
  9. `test_failure_propagation_missing_inputs`: Verified `FileNotFoundError` raised when raw input directories are empty or missing.
  10. `test_synthetic_patient_guardrail`: Verified `is_synthetic = True` constraint enforcement.
  11. `test_processed_dataset_invariants_if_present`: Verified live production invariants on generated canonical CSVs.

---

## 10. PostgreSQL and Neo4j Runtime Status

In strict accordance with Non-Negotiable Rule 6 (*"Do not claim that a command, test, database import, or application has succeeded unless you actually executed it and captured the result"*):

### 10.1 PostgreSQL Status
- **Static Syntax & Schema Review:** **PASS**
  - `01_schema.sql`, `02_constraints_indexes.sql`, `03_seed_synthetic.sql`, and `04_required_queries.sql` pass static SQL validation.
- **Runtime Server Status:** **NOT VERIFIED (Static Review Only)**
  - No active PostgreSQL daemon (`psql` client or PostgreSQL server port 5432) was provisioned in the agent sandbox.
  - No database was dropped, altered, or created.
  - Staged for teammate execution on local/Docker PostgreSQL 16+.

### 10.2 Neo4j Status
- **Static Cypher Review:** **PASS**
  - `01_constraints.cypher`, `02_import.cypher`, `03_queries.cypher`, and `GRAPH_SCHEMA.md` accurately model node keys, relationships, index-free adjacency, and bounded traversal ($k \le 3$).
- **Runtime Server Status:** **NOT VERIFIED (Static Review Only)**
  - No active Neo4j instance (`cypher-shell` or Neo4j port 7687) was available in the agent sandbox.
  - Staged for teammate execution on local/Docker Neo4j 5.x Community/Enterprise.

---

## 11. Defects Identified and Fixes Applied

| # | File | Defect Identified | Risk / Impact | Fix Applied | Result |
|:---:|---|---|---|---|:---:|
| 1 | `scripts/preprocessing/build_drug_mapping.py` | Normalized name dictionary indexing used simple assignment (`mec_by_norm[norm] = row`), which would silently overwrite duplicates if two source drugs normalized to the same string. | Potential silent entity loss if ambiguous or colliding names existed. | Refactored dictionary to `defaultdict(list)`, added explicit collision detection, generated `mapping_ambiguity_exceptions.csv`, and enforced source-exclusive retention without auto-merging for colliding names. | **Fixed & Verified** |
| 2 | `scripts/preprocessing/prepare_ddinter.py` | An empty raw input directory returned zero files and generated empty CSVs without throwing an error. | False success reporting during data preparation. | Added check: `if not files: raise FileNotFoundError(...)`. | **Fixed & Verified** |
| 3 | `scripts/preprocessing/prepare_mecddi.py` | Missing mechanism files printed a warning and continued instead of terminating. | Corrupted or incomplete mechanism ingestion. | Replaced warning with explicit `FileNotFoundError` for any missing mechanism file. | **Fixed & Verified** |
| 4 | `scripts/preprocessing/run_all.py` | Did not halt with non-zero exit code if validation status was not `PASSED`. | Silent pipeline failure propagation. | Added explicit check raising `RuntimeError` if `report.get("status") != "PASSED"`. | **Fixed & Verified** |
| 5 | `scripts/preprocessing/validate_data.py` | Did not validate source mapping foreign keys or pair foreign keys in severities and mechanisms. | Undetected referential integrity violations in secondary tables. | Added referential integrity and source mapping uniqueness checks to validation suite. | **Fixed & Verified** |
| 6 | `tests/unit/test_data_invariants.py` | Test coverage was limited to basic ordering, normalization, and domain sets. | Insufficient automated verification of error propagation and foreign key integrity. | Expanded test suite to 11 comprehensive tests including error propagation, uniqueness, and live production CSV checks. | **Fixed & Verified** (11/11 Passed) |
| 7 | `scripts/preprocessing/validate_data.py` | Trailing whitespaces detected by `git diff --check`. | Git hygiene violation. | Stripped trailing whitespaces on lines 112 and 117. `git diff --check` now exits with 0. | **Fixed & Verified** |

---

## 12. Outstanding Decisions for Human Review

The following items are documented for human confirmation during teammate review:
1. **Course ER Notation Final Visual Inspection:** The ER diagram strictly uses Chen notation with `(min, max)` constraints as taught in `docs/course-requirements/ER_MODEL.pdf`. Teammate should open `docs/database-design/ER_DIAGRAM.drawio` in diagrams.net to confirm visual layout preferences before lab submission.
2. **MecDDI Licensing Terms:** MecDDI raw and derived data remain untracked in Git. If course instructors require public GitHub submission of all datasets, teammate must seek clarification regarding external academic redistribution policies.
3. **Database Runtime Provisioning:** Teammate will run Docker containers (`docker-compose up -d postgres neo4j`) during Phase 2 to execute the staged SQL and Cypher scripts.

---

## 13. Audit Sign-Off Matrix

| Category | Sub-Item | Status |
|---|---|:---:|
| **Documentation & Scope** | Traceability to DBMS Level 3 Rubric | **PASS** |
| | Scope strictly bound to Phase 1 (No premature Phase 2/Next.js) | **PASS** |
| | Authority hierarchy respected (Rubric > Plan > Pitch) | **PASS** |
| **Data Integrity** | Raw CSVs unmodified | **PASS** |
| | Invariant: `drug_a_id < drug_b_id` | **PASS** |
| | Invariant: Zero duplicate canonical pairs | **PASS** |
| | Invariant: Referential integrity across all tables | **PASS** |
| | Invariant: Permitted domains for severity and mechanism | **PASS** |
| | No fabricated enzyme/receptor or clinical facts | **PASS** |
| **Data Engineering** | Preprocessing pipeline idempotence and determinism | **PASS** |
| | Ambiguity detection and exception reporting | **PASS** |
| | Automated test suite (11 invariant unit tests) | **PASS** |
| **Database Design** | Chen + (min, max) ER diagram (Draw.io, PDF, PNG) | **PASS** |
| | Table-by-table reconciliation across ERD, Schema, Dictionary, DDL | **PASS** |
| | BCNF and 4NF normalization proofs | **PASS** |
| **Database Runtime** | PostgreSQL 16+ DDL, seeds, queries, and triggers | **NOT VERIFIED** *(Static Review PASS)* |
| | Neo4j 5+ Cypher constraints, import, and path traversals | **NOT VERIFIED** *(Static Review PASS)* |
| **Git & Licensing** | Bulk data untracked in Git (`.gitignore` enforced) | **PASS** |
| | `git diff --check` clean (zero trailing whitespace) | **PASS** |
| | Zero unapproved commits or pushes | **PASS** |
