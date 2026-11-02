# Comprehensive Project Agent Context & Architectural Chronicle
## Patient-Specific Multi-Hop Drug Interaction Risk Discovery (RxGraph)
**Course Context:** PES University — DBMS Experiential Learning Level 3 (50 Marks Total)  
**Authors / Maintainers:** Varshit Gude (PES1UG24CS518) & Saatwik V (PES1UG24CS509)  
**Document Purpose:** Master context document capturing the entire end-to-end project narrative—from biomedical motivation and schema design, through runtime development, reviewer critiques, subsequent architectural expansions, current codebase anatomy, and presentation caveats.

---

## 1. Executive Summary & Core Identity

### 1.1 Project Title & Problem Domain
- **Official Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery
- **Platform Name:** **RxGraph**
- **The Clinical Blind Spot:**  
  Conventional hospital electronic health record (EHR) systems screen drug interactions using **isolated pairwise lookups** ($O(1)$ relational checks between Drug A and Drug B). In geriatric and complex patients experiencing **polypharmacy** (concurrent use of 5 or more medications), adverse drug events frequently manifest not through documented pairwise warnings, but via **indirect metabolic intermediate cascades** (multi-hop pathways).
- **The Core Biological Example:**  
  Consider a cardiac patient taking **Warfarin** (anticoagulant), **Amiodarone** (anti-arrhythmic), and **Simvastatin** (cholesterol-lowering statin).  
  - Pairwise tables document Warfarin $\leftrightarrow$ Amiodarone and Amiodarone $\leftrightarrow$ Simvastatin as distinct metabolic interactions.
  - Pairwise tables show **no direct adverse interaction** between Warfarin and Simvastatin.
  - However, in a patient receiving all three, Amiodarone heavily inhibits hepatic enzymes (CYP2C9 and CYP3A4), simultaneously slowing clearance of both Warfarin and Simvastatin, culminating in catastrophic rhabdomyolysis and hemorrhaging.
  - **RxGraph bridges this clinical gap** by modeling biomedical entities as an index-free adjacency property graph to uncover hidden 2-hop and 3-hop metabolic bottleneck pathways.

---

## 2. Polyglot Persistence Architecture (Why Dual Databases?)

The system strictly avoids treating either database as a second-class cache. Instead, it leverages the distinct theoretical strengths of relational and graph DBMS paradigms:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 APP ROUTER (FULL-STACK APPLICATION)                  │
│   • Doctor Dashboard (`/dashboard`)         • Patient Regimen & Screening (`/patients/[id]`) │
│   • Alerts & Session Audits (`/alerts`)     • DBMS Evaluation Studio (`/dbms-studio`)        │
└───────────────────────────────┬────────────────────────────┬───────────────────────────┘
                                │                            │
                Relational CRUD │ Transactions               │ Graph Path Traversal
                & Stored Logic  │ & Triggers                 │ (Cypher shortestPath)
                                ▼                            ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│        POSTGRESQL 16 (PORT 5432)             │ │       NEO4J 5 CE (BOLT :7687)        │
│  • BCNF / 4NF Relational Storage             │ │  • Native Property Graph Model       │
│  • Synthetic Patients, Prescriptions, Audits │ │  • Documented Drug Entities (:Drug)  │
│  • ACID Constraints (CASCADE, RESTRICT)      │ │  • Directed Interactions Edge        │
│  • Active Trigger: trg_assessment_findings   │ │  • Bounded Multi-Hop (1..3 Hops)     │
│  • Stored Procedure: fn_direct_screening     │ │  • Index-Free Adjacency (O(1) Step)  │
│  • Two-Tier DCL (role_doctor vs role_admin)  │ │  • Uniqueness Constraints on ID      │
└──────────────────────────────────────────────┘ └──────────────────────────────────────┘
```

### 2.1 The 30-Second Technology Justification (Verbatim for Examiner)
> *"We implement a dual-database polyglot architecture. **PostgreSQL** guarantees ACID transactional compliance, referential integrity across patient records and prescriptions, and immutable clinical audit logging via triggers.  
> **Neo4j** is purpose-built for multi-hop graph path discovery. Finding 2-hop or 3-hop bridges in SQL requires expensive recursive table self-joins ($O(N^k)$ join complexity). In contrast, Neo4j uses **index-free adjacency**, where nodes store direct physical pointers to adjacent edges in memory, allowing 2-hop and 3-hop candidate paths to be dereferenced in $O(1)$ pointer operations without join overhead."*

---

## 3. Chronicle of Phases: How the System Was Built

### Phase 1: Data Ingestion, Invariant Audits, and Conceptual Modeling
- **Source Biomedical Data:**
  - `DDInter`: Sourced for clinical severity classifications (`Major`, `Moderate`, `Minor`, `Unknown`).
  - `MecDDI`: Sourced for pharmacological mechanism categories (e.g. `Affected intra_extra-hepatic metabolism`, `Synergistic sedation`).
- **Data Harmonization & Provenance:**
  - Raw files processed via deterministic Python pipelines (`scripts/preprocessing/run_all.py`).
  - Strict data integrity: Drug names normalized, PubChem CIDs harmonized, SMILES and 27-character InChIKeys preserved for chemical deduplication.
  - Invariants mathematically verified via automated tests (`tests/unit/test_data_invariants.py` - 11/11 PASS).
  - SHA-256 cryptographic manifest generated in `data/manifests/source_manifest.csv`.
- **Conceptual Peter Chen ER Modeling:**
  - 10 Entity Sets: `DRUG`, `DRUG_SOURCE_MAPPING`, `DDI_PAIR`, `DDI_SEVERITY`, `DDI_MECHANISM`, `PATIENT`, `PRESCRIPTION`, `RISK_ASSESSMENT`, `ASSESSMENT_FINDING`, `USER_ACCOUNT`.
  - 12 Relationship Sets with explicit `(min, max)` structural constraints (e.g. `(1, 1)` total participation on child entities).
- **Relational Schema Normalization:**
  - Normalized strictly to **Boyce-Codd Normal Form (BCNF)** and **Fourth Normal Form (4NF)**.
  - Multi-valued dependencies ($pair \twoheadrightarrow severity$ and $pair \twoheadrightarrow mechanism$) decomposed into independent child tables (`ddi_severities` and `ddi_mechanisms`) to prevent Cartesian redundancy.
  - Exactly 11 physical foreign-key connectors matching relational constraints.

---

### Phase 2: Relational DDL, Constraints, Stored Logic & Graph Seeding
The database was structured into 5 foundational, sequentially idempotent SQL files in `database/postgres/`:

1. **`01_schema.sql` (Tables & Primary/Foreign Keys):**
   - 10 tables created with strict domain integrity.
   - Canonical pair ordering constraint: `CHECK (drug_a_id < drug_b_id)` to prevent symmetric duplicates `(A, B)` and `(B, A)`.
   - Synthetic guardrail constraint: `CHECK (is_synthetic = TRUE)` on `patients`.
   - Hop depth constraint: `CHECK (max_hop_depth BETWEEN 1 AND 3)` on `risk_assessments`.
   - Referential integrity rules:
     - `ON DELETE RESTRICT`: Applied on `drugs` referenced by `prescriptions`, `ddi_pairs`, and `assessment_findings` (prevents deleting active medications).
     - `ON DELETE CASCADE`: Applied on `patients` $\to$ `prescriptions` and `risk_assessments` $\to$ `assessment_findings` (enables clean cascade deletions).

2. **`02_constraints_indexes.sql` (Indexes, Views, Functions & Triggers):**
   - 13 B-tree indexes including composite indexes (`idx_prescriptions_patient_status`, `idx_severities_pair_lookup`).
   - Clinical View: `v_patient_active_regimens` querying active medications with calculated ages.
   - **Active Database Trigger (`trg_assessment_findings_count`):**  
     Fires `AFTER INSERT ON assessment_findings` executing `fn_update_assessment_counts()`. Automatically recalculates and updates summary metrics (`direct_interaction_count`, `multi_hop_candidate_count`) on the parent `risk_assessments` table. Configured with `SECURITY DEFINER SET search_path = public, pg_temp` to prevent search-path hijacking attacks.
   - **Stored PL/pgSQL Function (`fn_perform_patient_direct_screening`):**  
     Accepts `p_patient_id`, `p_doctor_username`, and `p_notes`. Dynamically determines active medication count, inserts an assessment session header, performs pairwise joins against `ddi_pairs`, and returns a tabular result set.

3. **`03_seed_synthetic.sql` (Curated Demonstration Cohort):**
   - Master drugs table seeded with 10 clinically relevant cardiovascular, antibiotic, and psychiatric drugs (Warfarin, Simvastatin, Amiodarone, Metoprolol, Lisinopril, Fluoxetine, Tramadol, Aspirin, Ibuprofen, Clarithromycin).
   - 9 verified pairwise interaction edges with DDInter severities and MecDDI mechanisms.
   - 4 synthetic patient profiles with multi-drug regimens:
     - Patient 1 (`Robert Vance`): 3 drugs (Warfarin, Amiodarone, Simvastatin) — Core demonstration patient.
     - Patient 2 (`Eleanor Wright`): 3 drugs (Fluoxetine, Tramadol, Ibuprofen) — Serotonergic/Bleeding risk.
     - Patient 3 (`Marcus Chen`): 3 drugs (Lisinopril, Metoprolol, Aspirin) — Cardiovascular regimen.
     - Patient 4 (`Sarah Jenkins`): 2 drugs (Simvastatin, Clarithromycin) — Statin toxicity risk.
   - 2 user accounts with bcrypt hashes (`admin` and `dr_sharma`).

4. **`04_required_queries.sql` (Rubric Query Showcase):**
   - 1.1–1.4: DML CRUD (Insert prescription, joined Select, Update dosage, Soft/Hard Delete).
   - 2.1–2.2: Multi-table `LEFT OUTER JOIN` with `string_agg()`, and `SELF-JOIN` on prescriptions generating unordered pairs.
   - 3.1–3.3: Nested subqueries with `EXISTS` (drugs with Major interactions), `IN` (patients on metabolic drugs), and `NOT EXISTS`.
   - 4.1: Aggregates with `GROUP BY` and `HAVING COUNT(dp.pair_id) >= 2`.
   - 5.1–5.2: Analytical Window Functions (`DENSE_RANK()` for mechanism popularity, and `ROW_NUMBER() OVER (PARTITION BY pr.patient_id)`).
   - 6.1–6.2: Common Table Expressions (CTEs) and **Recursive CTE** performing bounded 2-hop graph traversal in pure relational SQL!

5. **`05_roles_rbac.sql` (Database-Level Access Control):**
   - Roles: `role_doctor` (least privilege clinician) and `role_admin` (system oversight).
   - Dedicated login users: `app_doctor_user` (`DoctorPass#2026`) and `app_admin_user` (`AdminPass#2026`).
   - Hard Security Boundary: `REVOKE ALL ON TABLE user_accounts FROM role_doctor; REVOKE ALL ON TABLE user_accounts FROM PUBLIC;`. Attempting to read credentials as doctor throws PostgreSQL Error `42501 (permission_denied)`.

6. **Neo4j Graph Database Setup (`database/neo4j/`):**
   - Seeded with 10 `:Drug` nodes and 9 `:INTERACTS_WITH` directed relationships matching the curated subset.
   - Uniqueness constraint: `CREATE CONSTRAINT constraint_drug_id FOR (d:Drug) REQUIRE d.drug_id IS UNIQUE;`.
   - Cypher path traversals finding 1-hop direct, 2-hop bridge, and 3-hop bounded pathways.

---

### Phase 3 & 4: Application Development & Initial Viva Preparation
- **Full-Stack Implementation:** Built using Next.js 14 App Router (TypeScript). Server-side route handlers connected to PostgreSQL via connection pools (`pg`) and Neo4j via `neo4j-driver`.
- **Security & Session Management:** Signed HS256 JWT tokens stored in `HttpOnly`, `SameSite=Lax` cookies named `drug_interaction_session`. Edge middleware guarding clinical routes.
- **Initial Verification Guides:** Generated `FINAL_VIVA_DEMO_GUIDE.md` and `COMPREHENSIVE_VIVA_PREP_GUIDE.md`.
- **Automated Test Suites Passing (67/67):**
  - Cross-database integration tests: 30/30 PASS
  - Authentication and RBAC tests: 26/26 PASS
  - Data ingestion invariant tests: 11/11 PASS

---

## 4. The Turning Point: Evaluator Feedback & Reviewer Critiques

Following an initial review session, the examiner delivered two sharp critiques that required an architectural evolution:

### Critique 1: *"Why is `USER_ACCOUNT` an entity in the ER diagram? In DBMS, users must be created via SQL `CREATE USER` and assigned roles!"*
- **The Teacher's Perspective:** In traditional academic DBMS curricula, user identity belongs strictly to the Data Control Language (DCL) subsystem (`CREATE USER`, `CREATE ROLE`, `GRANT`, `REVOKE`, `pg_roles`). The examiner questioned why an application table was used instead of native database users.
- **The Architectural Defense (The Two-Tier Enterprise Model):**
  - In enterprise healthcare (Epic Systems, Cerner), patient confidentiality regulations (HIPAA) demand a **Two-Tier Architecture**:
    1. **Tier 1 (Application Profile Layer):** `public.user_accounts` stores clinical display names, medical licenses, department affiliations, and audit trails. PostgreSQL’s internal `pg_user` cannot hold domain-specific medical metadata.
    2. **Tier 2 (Database Engine DCL Layer):** Native PostgreSQL engine users (`CREATE USER`) and roles (`role_doctor`, `role_admin`) enforce schema-level permissions and least-privilege boundaries at the DBMS kernel level.
- **The Solution Implemented:** Enhanced account provisioning so that creating a user in the UI **actively executes PostgreSQL DCL (`CREATE USER` + `GRANT`)** and displays both `pg_roles` and `user_accounts` side-by-side in the interface!

### Critique 2: *"The frontend is too simple. You are switching to pgAdmin 4 for everything! Show constraints, triggers, procedures, and cascading deletions directly from the web application!"*
- **The Teacher's Perspective:** Demonstrating SQL concepts by pasting queries into pgAdmin 4 or terminal CLI was viewed as an incomplete application slice. The examiner demanded that every rubric feature be triggerable from the web UI, causing real-time, verifiable changes on disk.
- **The Solution Implemented:** Formulated [`PROJECT_REQUIREMENTS.md`](docs/reviews/PROJECT_REQUIREMENTS.md) and developed the **DBMS Operations Studio (`/dbms-studio`)** alongside clinical full CRUD and an interactive force-directed graph canvas.

---

## 5. What Was Built on Top of the Feedback (Commit `4e16e23`)

In response to the feedback, the team implemented a massive 35-file expansion (+5,619 lines of code):

### 5.1 The DBMS Operations Studio (`/dbms-studio`)
A dedicated, all-in-one evaluation dashboard housing 6 interactive evaluation modules matching the PESU Level 3 rubric:

1. **Tab 1: Constraints Lab (`RESTRICT`, `CASCADE`, `CHECK`):**
   - **`ON DELETE RESTRICT` Live Rejection:** Button attempts deleting Warfarin (`drug_id = 1`) $\to$ backend executes `DELETE FROM drugs WHERE drug_id = 1` $\to$ PostgreSQL rejects with Error `23503 (foreign_key_violation)` on constraint `fk_pair_drug_a` $\to$ UI displays a prominent red warning banner explaining referential integrity.
   - **`ON DELETE CASCADE` Live Multi-Table Cleanup:** Button spawns an ephemeral test patient with child records across 4 tables (`patients`, `prescriptions`, `risk_assessments`, `assessment_findings`) $\to$ "Delete Parent Patient" triggers `DELETE FROM patients` $\to$ UI displays animated counters dropping from `[1, 2, 1, 2]` to `[0, 0, 0, 0]`.
   - **`CHECK` Constraints Sandbox:** Buttons intentionally testing `is_synthetic = FALSE` (Error 23514), `max_hop_depth = 5` (Error 23514), and `drug_a_id > drug_b_id` (Error 23514).

2. **Tab 2: Triggers & Automated Audit Counters (`trg_assessment_findings_count`):**
   - Displays parent `risk_assessments` row.
   - Button inserts a finding row (`AFTER INSERT ON assessment_findings`).
   - Trigger `trg_assessment_findings_count` executes `fn_update_assessment_counts()`.
   - UI shows a live **Before $\to$ Action $\to$ After** audit card with direct interaction count incrementing from `0` $\to$ `1` live!

3. **Tab 3: Stored Procedures & Functions Runner:**
   - Parameter form allowing clinician to choose patient, username, and notes.
   - Button invokes `fn_perform_patient_direct_screening(p_patient_id, p_doctor_username, p_notes)`.
   - Shows execution latency (`~8ms`) and renders returned direct interaction table.

4. **Tab 4: Advanced SQL & Recursive CTE Showcase:**
   - One-click execution runners for all 7 required rubric queries.
   - Displays syntax-highlighted SQL, execution timing, and rendered tabular data grids.
   - Includes **Recursive CTE 2-Hop Graph Traversal in SQL** matching Warfarin to Simvastatin via Amiodarone.

5. **Tab 5: DDL & Schema Studio:**
   - Dropdown of all 10 tables querying `information_schema.columns`.
   - Automated **"Show Create Table" DDL generator** with syntax highlighting and copy button.
   - Live catalog of all 41 primary, foreign, unique, and check constraints from `pg_constraint`.

6. **Tab 6: DCL, Engine Roles & User Management:**
   - Account creation form executing:
     ```sql
     CREATE USER <username> WITH PASSWORD '<password>';
     GRANT role_doctor TO <username>;
     INSERT INTO user_accounts (...) VALUES (...);
     ```
   - Live side-by-side view: **PostgreSQL Engine Catalog (`pg_roles` / `pg_user`)** next to **Application Profiles (`user_accounts`)**.
   - **"Test Least Privilege"** button executing query as `app_doctor_user` to catch PostgreSQL Error `42501 (insufficient_privilege)`.

---

### 5.2 Clinical Operations Full CRUD
- **Dashboard (`/dashboard`):** Added `+ Add New Synthetic Patient` modal, live search filter, and delete patient controls.
- **Patient Profile (`/patients/[id]`):**
  - Added `+ Prescribe Medication` modal with live drug catalog dropdown.
  - Added inline dosage editing (click dosage pill $\to$ edit $\to$ commits via `PATCH /api/prescriptions`).
  - Added discontinue/delete medication buttons.

---

### 5.3 Interactive Neo4j Graph Visualizer (`/patients/[id]`)
- Embedded HTML5 Canvas force-directed graph viewer with **draggable nodes**, particle pulse animation along interaction edges, severity filters (`Major`, `Moderate`), and hop radius controls.
- Full Graph NoSQL RUD API (`/api/neo4j/graph-rud`) supporting node/edge creation, property updates, and deletion.

---

### 5.4 Architecture Pipeline Walkthrough (`/architecture`)
- Interactive 4-step pipeline tracing:
  1. Next.js Edge Middleware JWT verification.
  2. PostgreSQL stored direct screening.
  3. Neo4j bounded multi-hop Cypher traversal.
  4. Trigger-based transactional persistence.

---

### 5.5 Design Exploration & Reversion (Stream 1 from `handout.md`)
- A high-density redesign was experimentally attempted on branch `feature/frontend-design-elevation` (commit `2ba4f31`).
- The team decided that the stable `main` branch (commit `4e16e23`) had superior visual clarity and cohesion for the viva evaluation.
- All experimental code was cleanly committed and preserved in `feature/frontend-design-elevation`, while **`main` remains the active, tested, and rock-solid presentation base**.
- Official Project Report was generated in [`docs/DBMS_PROJECT_REPORT.md`](docs/DBMS_PROJECT_REPORT.md) and published to Google Docs.

---

## 6. Complete Viva Demonstration Script & Dual-Verification Commands

This section provides the exact click sequence in the UI and corresponding verification queries in pgAdmin 4 / Neo4j Browser:

| Rubric Concept | Mark | Frontend Action in Web UI | What to Say to Examiner | Dual-Verification Query in pgAdmin 4 / Neo4j |
|---|---|---|---|---|
| **1. ER Diagram** | 2 | Show PDF viewer: `ER_Diagram_Final.pdf` | *"Peter Chen notation with 10 entities, 12 relationships, (min,max) structural constraints. User entity represents Application Profile layer."* | Inspect entity catalog in `docs/database-design/ER_MODEL.md` |
| **2. Relational Schema** | 3 | Show PDF viewer: `Relational_Schema_Final.pdf` | *"Normalized to BCNF and 4NF. Severities and mechanisms decomposed to eliminate multi-valued dependencies. 11 physical foreign keys."* | Inspect `docs/database-design/NORMALIZATION.md` |
| **3. DDL & Constraints** | 4 | Go to `/dbms-studio` $\to$ **DDL Studio** & **Constraints Lab** | *"All 10 tables and 41 constraints are inspectable live. Our DDL enforces ON DELETE RESTRICT on drugs and synthetic invariants on patients."* | In pgAdmin: `SELECT * FROM pg_constraint WHERE connamespace = 'public'::regnamespace;` |
| **ON DELETE RESTRICT** | — | In Constraints Lab: Click *"Attempt Deletion of Referenced Drug"* | *"PostgreSQL rejected deleting Warfarin with Error 23503 because Patient 1 has an active prescription, preventing orphan records."* | In pgAdmin: `SELECT * FROM drugs WHERE drug_id = 1;` (Row remains intact) |
| **ON DELETE CASCADE** | — | In Constraints Lab: Click *"Spawn Ephemeral Patient"*, then *"Delete Parent Patient"* | *"Deleting the parent patient automatically cascaded across 4 tables: deleting 2 prescriptions, 1 assessment, and 2 findings in one atomic transaction."* | In pgAdmin: `SELECT count(*) FROM prescriptions WHERE patient_id = <ephemeral_id>;` (Returns 0) |
| **4 & 9. Neo4j Graph Traversal** | 11 | On `/patients/1`: Click *"Run Risk Screening"* $\to$ Scroll to Graph Canvas | *"Neo4j performs bounded 1..3 hop traversal. While Warfarin and Simvastatin have no pairwise warning, Neo4j discovers Amiodarone as the 2-hop bridge."* | In Neo4j Browser: `MATCH p = (d1:Drug {canonical_name:'warfarin'})-[r:INTERACTS_WITH*2]-(d2:Drug {canonical_name:'simvastatin'}) RETURN p;` |
| **6. DML Operations** | 4 | On `/dashboard`: Click *"+ Add Patient"*; On `/patients/1`: Edit dosage pill | *"Full CRUD operations: Patients and prescriptions can be inserted, queried, updated, and deleted directly, synchronously mutating the database."* | In pgAdmin: `SELECT * FROM patients WHERE full_name = 'Diana Prince';` |
| **7. Advanced SQL & CTEs** | 4 | In `/dbms-studio` $\to$ **Advanced SQL**: Run Query 7 (*Recursive CTE*) | *"We contrast Neo4j graph traversal with a 2-hop Recursive Common Table Expression in PostgreSQL SQL, returning the exact same bridge path."* | Paste Query 6.2 from `04_required_queries.sql` into pgAdmin Query Tool |
| **8. Stored Procedures & Functions** | 6 | In `/dbms-studio` $\to$ **Procedures**: Click *"Invoke Stored Function"* | *"Executes fn_perform_patient_direct_screening() in PostgreSQL, generating assessment sessions and returning direct pairs in sub-10 milliseconds."* | In pgAdmin: `SELECT * FROM fn_perform_patient_direct_screening(1, 'dr_sharma');` |
| **Triggers (Before & After)** | — | In `/dbms-studio` $\to$ **Triggers**: Click *"Insert Finding Row"* | *"Trigger trg_assessment_findings_count fires AFTER INSERT, updating parent direct_interaction_count from 0 to 1 as a materialized summary counter."* | In pgAdmin: `SELECT direct_interaction_count FROM risk_assessments ORDER BY assessment_id DESC LIMIT 1;` |
| **10 & 11. Next.js Interface** | 5 | Demonstrate live UI navigation across `/dashboard`, `/patients/1`, `/alerts`, `/dbms-studio` | *"Next.js 14 App Router connected to PostgreSQL pools and Neo4j Bolt driver with zero client-side mock data."* | Check Network tab: All actions trigger real `/api/...` calls returning JSON payloads |
| **12. Authentication & RBAC** | 4 | In `/dbms-studio` $\to$ **DCL & Roles**: Click *"Test Least Privilege as Doctor"* | *"Two-tier security: UI creates PostgreSQL engine users via CREATE USER and GRANT. Database engine denies role_doctor access to user credentials with Error 42501."* | In pgAdmin: `SET ROLE role_doctor; SELECT * FROM user_accounts;` (Throws Error 42501) |
| **13 & 14. Testing & Originality** | 6 | Terminal: `npm run test:integration` & `npm run test:auth` | *"67 automated test assertions verify data invariants, cross-database integration, and RBAC security boundaries."* | Terminal displays 30/30, 26/26, 11/11 PASS |

---

## 7. How the Presentation Caveats Were Fully Resolved in Code

All previous operational caveats have been engineered directly into the software so the presenter can execute a flawless, zero-terminal viva:

### ✅ Caveat 1: Trigger Counter Pollution $\longrightarrow$ Resolved with Isolated Demo Sandbox & One-Click Reset
- **What Was Fixed:** Previously, Tab 2 mutated whichever assessment was most recent, which risked polluting real clinical assessments and permanently incrementing counters.
- **The Code Solution (`app/api/dbms/triggers/demo/route.ts` & Tab 2):**
  - Dedicated isolated session created with `assessment_notes = 'DBMS_STUDIO_TRIGGER_DEMO'`.
  - Added a **"Reset Trigger Sandbox (0/0)"** button right in the UI (`?reset=true`).
  - Clicking this purges the isolated test session and resets both counters back to `0/0` instantly without ever running `psql` or seed scripts!

### ✅ Caveat 2: Leftover Cascade Patients $\longrightarrow$ Resolved with Automated Sandbox Sweeping
- **What Was Fixed:** Previously, if a presenter spawned an ephemeral patient in Tab 1 and forgot to delete it, that patient lingered in the cohort.
- **The Code Solution (`app/api/dbms/constraints/test-cascade/route.ts` & Tab 1):**
  - Calling `DELETE /api/dbms/constraints/test-cascade` without a `patient_id` parameter automatically sweeps and purges all records matching `mrn LIKE 'CASCADE-TEST-%'`.
  - Tab 1 automatically triggers this sweep on load, guaranteeing the Constraints Lab starts from a 100% pristine state on every visit!

### ✅ Caveat 3: User DCL Dollar-Quoting `$1` Bug $\longrightarrow$ Resolved with Literal Escaping & Self-Clean (`DROP USER`)
- **What Was Fixed:** In PostgreSQL, extended query protocol bind parameters (`$1`, `$2`) are not recognized inside a dollar-quoted anonymous `DO $$ ... $$` code block (which previously threw error `08P01` while silently returning success).
- **The Code Solution (`lib/auth/auth-service.ts` & `app/api/admin/users/route.ts`):**
  - Used `dclClient.escapeLiteral(data.password)` and direct identifier interpolation within the `DO $$` block, with an atomic rollback of the application row if the engine DCL fails.
  - Added `deleteUser(username)` which executes `DROP OWNED BY` and `DROP USER`, and exposed it via `DELETE /api/admin/users`.
  - Added a **"Remove Demo Account & Self-Clean (DROP USER)"** button in Tab 6 so you can create `dr_kapoor`, show the examiner `pg_roles`, and then delete her with one click to repeat the demo infinitely!

### 💡 Remaining Theoretical Question to Keep in Mind: Solid vs. Dotted Ovals in ER
- **The Examiner Question:** The examiner may ask why `direct_interaction_count` on `RISK_ASSESSMENT` is drawn with a solid oval instead of a dashed (derived) oval.
- **The Perfect Answer:**
  > *"Ma'am, in pure conceptual ER theory, unpersisted derived counts are drawn dashed. However, in our system, these counts are **physically stored materialized base columns** maintained in real time by our active database trigger (`trg_assessment_findings_count`) for $O(1)$ dashboard performance. We drew them solid to maintain an exact 1:1 fidelity with our physical PostgreSQL DDL schema."*

---

## 8. Master Credentials & Connection Ports Reference

| Service | Access URL / Port | Username | Password | Role / Purpose |
|---|---|---|---|---|
| **Next.js Doctor Portal** | `http://localhost:3000/login` | `dr_sharma` | `Doctor@123` | Clinician Role (`role_doctor`): Prescriptions & Screening |
| **Next.js Admin Portal** | `http://localhost:3000/login` | `admin` | `Admin@123` | Administrator Role (`role_admin`): DBMS Studio & DCL |
| **PostgreSQL Database** | `localhost:5432` / `drug_interaction_db` | `postgres` | `postgres` | Superuser administrative access |
| **PostgreSQL Doctor User** | `localhost:5432` / `drug_interaction_db` | `app_doctor_user` | `DoctorPass#2026` | Least-privilege engine user (`role_doctor`) |
| **PostgreSQL Admin User** | `localhost:5432` / `drug_interaction_db` | `app_admin_user` | `AdminPass#2026` | Administrative engine user (`role_admin`) |
| **Neo4j Browser** | `http://localhost:7474` (Bolt: `:7687`) | `neo4j` | `password123` | Native Graph Browser & Cypher Query Console |

---

## 9. Conclusion: The Full Project Arc

RxGraph has evolved from an initial experimental research pitch into a **fully realized, rubric-complete, enterprise-grade database systems prototype**. By confronting the examiner's feedback head-on, the team elevated the platform into an all-in-one **DBMS Operations Studio** that demonstrates every facet of database engineering—from BCNF/4NF normalization and ACID foreign key cascades to active event triggers, stored procedures, recursive SQL CTEs, native NoSQL graph traversals, and Two-Tier engine DCL security—all operating seamlessly within a modern web interface backed by 67 passing automated test assertions.

