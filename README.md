# Patient-Specific Multi-Hop Drug Interaction Risk Discovery

An experiential learning database-systems prototype for exploring explainable polypharmacy risk using relational data modeling and bounded graph traversal.

**Course Context:** PES University — DBMS Experiential Learning Level 3 (August–December 2026)
**Authors:** Student Project Team

---

## 1. Project Purpose and Scope

Patients taking multiple concurrent medications (polypharmacy) often face adverse interaction risks that conventional pairwise lookups fail to uncover. Many complex interactions manifest through shared metabolic pathways, competitive substrate clearance, or cascading pharmacodynamic effects spanning intermediary biological entities.

This project implements a **dual-database decision-support prototype** comparing conventional pairwise interaction lookups with bounded graph traversals (direct 1-hop, 2-hop shared-partner bridges, 3-hop bounded cascades) across synthetic patient medication lists.

> [!NOTE]
> **Scope & Non-Clinical Disclaimer**: This software is an academic database-systems prototype and research demonstration. It is **not** a clinical diagnostic or prescribing tool, does not claim to discover novel medical interactions, and utilizes exclusively synthetic patient profiles. Multi-hop traversals return **candidate mechanism pathways** for clinical review, not proven adverse drug events.

---

## 2. System Architecture

The system integrates relational ACID transactions with graph path analytics:

```text
+-------------------------------------------------------------+
|                     Next.js Web Application                 |
|            (Interactive UI & Role-Based Views)              |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                 Server-Side API Layer (Next.js)             |
|   - Authentication & Role-Based Authorization (Doctor/Admin)|
|   - Input Validation & Parameter Sanitization               |
|   - Multi-Hop Graph Traversal & Relational Orchestration    |
+-------------------------------------------------------------+
               |                               |
               v                               v
+-----------------------------+ +-----------------------------+
|     PostgreSQL (Relational) | |        Neo4j (Graph)        |
| - Canonical Drug Catalog    | | - Drug Nodes                |
| - Relational Integrity (CK) | | - Documented Interactions   |
| - Synthetic Patients        | | - Severity & Mechanisms     |
| - Prescriptions (ACID)      | | - 1-Hop Direct Screening    |
| - Clinical Session Audits   | | - 2/3-Hop Candidate Paths   |
+-----------------------------+ +-----------------------------+
```

For detailed architectural rationale and rubric evaluation comparisons, refer to [Technology Justification](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/TECHNOLOGY_JUSTIFICATION.md).

---

## 3. Data Sources & Licensing Caveats

The project harmonizes two curated biomedical interaction datasets:

1. **DDInter (Drug-Drug Interaction Database)**:
   - **Coverage:** 8 ATC classification files (Codes A, B, D, H, L, P, R, V) totaling 222,383 rows and 160,235 unique pairs across 1,939 drugs.
   - **License:** [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (Attribution, NonCommercial, ShareAlike).
   - **Content:** Severity levels (`Major`, `Moderate`, `Minor`, `Unknown`).
2. **MecDDI (Mechanism-Based Drug-Drug Interactions)**:
   - **Coverage:** 1,922 master drugs, 178,406 unique interaction pairs, and 7 mechanism categories across 197,305 records.
   - **License:** *All Rights Reserved* for educational/non-commercial research.
   - **Licensing Boundary:** All raw source files and full processed datasets are strictly local and Git-ignored. See [`data/manifests/data_sources.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/manifests/data_sources.md) and [`data/manifests/source_manifest.csv`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/manifests/source_manifest.csv).

---

## 4. Repository Structure

```text
drug-interaction-risk-discovery/
├── AGENTS.md                  # Persistent AI operating instructions and authority hierarchy
├── README.md                  # Central project documentation
├── .env.example               # Environment configuration template
├── .gitignore                 # Safe exclusions (data/raw/, data/processed/, secrets)
│
├── database/
│   ├── postgres/              # PostgreSQL DDL, constraints, triggers, seed & queries
│   │   ├── 01_schema.sql
│   │   ├── 02_constraints_indexes.sql
│   │   ├── 03_seed_synthetic.sql
│   │   └── 04_required_queries.sql
│   └── neo4j/                 # Neo4j Cypher constraints, imports, and CRUD queries
│       ├── 01_constraints.cypher
│       ├── 02_import.cypher
│       ├── 03_queries.cypher
│       └── README.md
│
├── data/
│   ├── raw/                   # Unmodified raw CSV files (Git-ignored)
│   ├── processed/             # Cleaned canonical tables & validation reports (Git-ignored)
│   ├── manifests/             # Tracked provenance documentation & source manifest CSV
│   └── samples/               # Small test fixtures
│
├── docs/
│   ├── README.md              # Central documentation index
│   ├── course-requirements/   # Official DBMS Level 3 Evaluation Criteria PDF
│   ├── project-plan/          # Project Pitch PDF & Four-Day Implementation Plan MD
│   ├── database-design/       # ER_Diagram_Final (.drawio, .pdf, .png), Relational_Schema_Final (.drawio, .pdf, .png),
│   │                          # RELATIONAL_SCHEMA, DATA_DICTIONARY, NORMALIZATION, GRAPH_SCHEMA, etc.
│   └── data-dictionary/       # source-audit.md deep statistical audit report
│
├── scripts/
│   └── preprocessing/         # Reproducible Python data preparation pipeline
│       ├── run_all.py         # Master pipeline orchestrator
│       ├── inspect_sources.py # 17-file audit tool
│       ├── prepare_ddinter.py # DDInter extractor & normalizer
│       ├── prepare_mecddi.py  # MecDDI extractor & normalizer
│       ├── build_drug_mapping.py # Unified entity reconciler
│       ├── validate_data.py   # Automated integrity validator
│       └── generate_er_diagram.py # draw.io XML & diagram export generator
│
└── tests/
    └── unit/                  # Unit test suite verifying data invariants
        └── test_data_invariants.py
```

---

## 5. Reproducible Preprocessing & Validation

To execute the end-to-end data preparation pipeline:

```bash
# 1. Run all preprocessing stages deterministically
PYTHONPATH=scripts/preprocessing python3 scripts/preprocessing/run_all.py

# 2. Run data invariant unit tests
python3 -m unittest discover tests/unit/
```

### Automated Invariant Checks
The pipeline validates:
- **Canonical Ordering Invariant:** $\text{drug\_a\_id} < \text{drug\_b\_id}$ across all 219,040 pairs (0 violations).
- **Referential Integrity:** 100% of pair endpoints resolve to valid entries in `canonical_drugs` (0 unmatched).
- **Pair Uniqueness:** Zero duplicate unordered pairs.
- **Domain Conformance:** Severities match `('Major', 'Moderate', 'Minor', 'Unknown')` and mechanisms match the 7 permitted categories.
- **Output:** Verified report at `data/processed/validation_report.json`.

---

## 6. Database Setup Instructions

### 6.1 PostgreSQL Setup
Execute the scripts in numerical order using `psql` or pgAdmin:

```bash
# 1. Create relational tables, foreign keys, and check constraints
psql -U postgres -d drug_interaction_db -f database/postgres/01_schema.sql

# 2. Apply performance indexes, triggers, and stored procedures
psql -U postgres -d drug_interaction_db -f database/postgres/02_constraints_indexes.sql

# 3. Seed demonstration cohort (10 drugs, 9 pairs, 4 synthetic patients, 2 roles)
psql -U postgres -d drug_interaction_db -f database/postgres/03_seed_synthetic.sql

# 4. Run and verify required evaluation queries (DML, CTEs, Window functions, Joins)
psql -U postgres -d drug_interaction_db -f database/postgres/04_required_queries.sql

# 5. Apply database-level RBAC roles and least-privilege grants
psql -U postgres -d drug_interaction_db -f database/postgres/05_roles_rbac.sql
```

### 6.2 Neo4j Graph Setup
Execute the Cypher scripts in order using `cypher-shell` or Neo4j Browser:

```bash
# 1. Create uniqueness constraints and indexes
cypher-shell -u neo4j -p YOUR_PASSWORD -f database/neo4j/01_constraints.cypher

# 2. Seed demonstration graph nodes and interaction edges
cypher-shell -u neo4j -p YOUR_PASSWORD -f database/neo4j/02_import.cypher

# 3. Execute multi-hop traversals and NoSQL CRUD demonstrations
cypher-shell -u neo4j -p YOUR_PASSWORD -f database/neo4j/03_queries.cypher
```

### 6.3 Automated Test Suites
Run the automated verification suites:

```bash
# Day 2 cross-database integration & end-to-end orchestration tests (30/30 assertions)
npm run test:integration

# Day 3 authentication, server RBAC, and database-level PostgreSQL role tests (26/26 assertions)
npm run test:auth

# Data invariant and preprocessing unit tests (11/11 tests)
python3 -m unittest discover tests/unit/
```

---

## 7. Key Project Documents & Authority Hierarchy

The project operates under a strict three-tier decision hierarchy:
1. **Official Rubric:** [`docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf) (*Authoritative Grading Standard — 50 marks*).
2. **Four-Day Plan:** [`docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md) (*Current Execution Contract*).
3. **Project Pitch:** [`docs/project-plan/PROJECT_PITCH.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/PROJECT_PITCH.pdf) (*Conceptual Vision & Long-Term Context*).

For detailed guidance, see [`AGENTS.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/AGENTS.md) and [`docs/README.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/README.md).

---

## 8. Known Limitations

1. **Source Mechanism Granularity:** Neither DDInter nor MecDDI provides named enzyme nodes (e.g. CYP2D6, CYP3A4) or biological target receptors; MecDDI categorizes interactions into high-level mechanism labels. The graph schema models drug-to-drug edges with mechanism properties rather than inventing non-existent target nodes.
2. **Exploratory Multi-Hop Paths:** Indirect pathways ($A \to C \to B$) are algorithmic hypotheses indicating shared interaction partners, not verified clinical polypharmacy interactions.
3. **Academic Usage:** Bulk raw datasets are subject to non-commercial academic licenses and must not be distributed publicly.

---

## 9. Current Status & Next Steps

- **Completed (Phase 1 & Day 1):** Comprehensive 17-file data audit, source manifest, licensing documentation, editable draw.io ER diagram (`.drawio`, `.pdf`, `.png`), relational schema (BCNF/4NF), data dictionary, normalization analysis, graph schema, technology justification, complete PostgreSQL DDL + procedures/triggers, Neo4j Cypher suite, preprocessing pipeline, and unit invariant tests.
- **Completed (Day 2):** Docker compose orchestration (Postgres 16 + Neo4j 5), runtime verification, cross-database integration orchestrator, stored procedure execution, trigger counter updates, and full API routes (`/api/patients`, `/api/patients/[id]`, `/api/patients/[id]/analyze-risk`, `/api/alerts`).
- **Completed (Day 3 Prompt 1):** Full authentication & session management (salted bcrypt password hashing, cryptographically signed HttpOnly JWT sessions), application-level RBAC (`DOCTOR` vs `ADMIN`), database-level PostgreSQL RBAC (`role_doctor`, `role_admin`, `app_doctor_user`, `app_admin_user` with least privilege), and comprehensive automated test suite (26/26 assertions).
- **Next Phase (Day 3 Prompt 2):** Build the Doctor interactive dashboard, patient detail/analysis interface, alerts page, and Admin management interface.