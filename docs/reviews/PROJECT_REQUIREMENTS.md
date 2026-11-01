# Comprehensive Project Requirements Document (PRD)
## Next-Level Frontend & End-to-End DBMS Evaluation Studio
### Patient-Specific Multi-Hop Drug Interaction Risk Discovery
**Course Context:** PES University — DBMS Experiential Learning Level 3 (50 Marks)  
**Document Target Audience:** Teammate & AI Coding Agent implementing this specification end-to-end.  
**Authority Standards:** [`DBMS_Level3_Evaluation_Criteria.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf) and [`FINAL_VIVA_DEMO_GUIDE.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/FINAL_VIVA_DEMO_GUIDE.md).

---

## 1. Executive Summary & Reviewer Mission Brief

### 1.1 The Problem Being Addressed
Following our initial evaluation review, our evaluator delivered two critical pieces of feedback:
1. **User Identity & Security (ER Diagram vs. DCL Commands):**
   * *Reviewer Remark:* The reviewer questioned having `USER_ACCOUNT` as an entity in the conceptual ER diagram. She stated that database users must be created using PostgreSQL engine Data Control Language (`CREATE USER`, `GRANT role_*`) rather than purely living in an application table.
   * *Directive:* We must retain the ER entity by defending the **Two-Tier Enterprise Security Architecture** (Application Profile Metadata vs. DBMS Engine DCL), while enhancing our user management system so that creating a user in the UI **actively executes native PostgreSQL `CREATE USER` and `GRANT` statements**, with live verification from PostgreSQL system catalogs (`pg_user`, `pg_roles`).
2. **Frontend Interactivity & Evaluation Depth:**
   * *Reviewer Remark:* The frontend was deemed *"too simple"*. The evaluator was dissatisfied with having to switch to pgAdmin 4 or terminal CLI to demonstrate core DBMS concepts (constraints, triggers, procedures, CTEs, cascaded deletions).
   * *Directive:* **Every single rubric item** from [`FINAL_VIVA_DEMO_GUIDE.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/FINAL_VIVA_DEMO_GUIDE.md)—including `ON DELETE RESTRICT`, `ON DELETE CASCADE`, check constraints, DML CRUD, triggers (before & after), stored procedures, window functions, recursive CTEs, and Neo4j graph operations—**must be directly triggerable and visualizable from the Next.js frontend**, causing verified real-time mutations in PostgreSQL and Neo4j.
   * Dual-verification remains available in pgAdmin 4 / Neo4j browser as secondary confirmation, but the primary live execution **must happen within the web application interface**.

### 1.2 Core Operational Paradigm
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14 App Router)                                │
│   [Action Triggered: Form Submit / Cascade Delete / Trigger Run / Procedure Exec]      │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ Authenticated Server-Side API Call
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND & PERSISTENCE (ACID & Graph Engines)                       │
│  • PostgreSQL 16: Executes DML / DCL (`CREATE USER`) / Triggers / Stored Functions    │
│  • Neo4j 5: Executes Cypher Graph Traversals / Node & Edge Manipulations               │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ Real-Time Mutation Confirmation
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      DUAL-VERIFICATION OBSERVED LIVE                                   │
│  1. In-App Visualizer: Immediate UI State Transition + PostgreSQL Error/Success Banner │
│  2. pgAdmin 4 / Neo4j Browser: Exact SQL/Cypher queries proving disk-level mutation   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Non-Negotiable Architecture Invariant: Strict Bidirectional End-to-End Synchronization
> [!IMPORTANT]
> **NO MOCKING. NO CLIENT-ONLY DUMMY STATE. 100% DATABASE GROUND TRUTH.**
>
> The implementing agent and teammate MUST adhere to this strict invariant across all pages and features:
> 1. **Zero Fake State / Zero Local Mocking:** Every single button, form submission, status toggle, dosage edit, cascade deletion, trigger firing, and user creation in the frontend **MUST execute real SQL or Cypher against the running PostgreSQL (`port 5432`) and Neo4j (`ports 7474, 7687`) instances**. Under no circumstances should any feature use dummy `setTimeout` delays, in-memory mock arrays, or purely client-side state manipulation without a corresponding database commit.
> 2. **Strict Frontend $\longrightarrow$ Database Mutation:**
>    * When a user adds a patient, prescription, or doctor in the Next.js UI, the backend must immediately execute `INSERT` / `CREATE USER` and commit to disk. Opening pgAdmin 4 or terminal `psql` and querying the table MUST display that newly added record with its real sequence-generated primary key.
>    * When a user clicks "Delete Patient (Cascade Demo)" in the UI, running a query in pgAdmin 4 must show 0 child prescriptions and 0 child findings.
> 3. **Strict Database $\longrightarrow$ Frontend Synchronization:**
>    * If an examiner or clinician inserts, updates, or deletes a record directly in pgAdmin 4, reloading or re-fetching in the Next.js interface MUST instantly reflect that exact ground-truth state (counts, badges, table rows).
>    * The UI is a direct, living mirror of PostgreSQL and Neo4j. Both systems must remain in **100% bidirectional synchronization at all times**.

---

## 2. Reviewer Defense Strategy: Two-Tier User Architecture

When the examiner asks why `USER_ACCOUNT` is an entity in the ER diagram and whether we use `CREATE USER`:

### 2.1 The 30-Second Viva Defense Script
> *"Ma'am, in enterprise clinical software (such as hospital EHRs adhering to HIPAA), user management requires a **Two-Tier Architecture**:*
> 1. * **Application Profile Layer (`user_accounts` in ER):** PostgreSQL internal system catalogs (`pg_user`) only store credentials and cannot hold clinical metadata such as full doctor names, medical license numbers, clinical departments, or account status (`is_active`). Therefore, `USER_ACCOUNT` is conceptually modeled as an application entity.*
> 2. * **Database Engine Security Layer (DCL in PostgreSQL):** At the DBMS level, we enforce true Data Control Language. When an administrator creates a doctor in our interface, the backend executes `CREATE USER <username> WITH PASSWORD ...` and `GRANT role_doctor TO <username>`. Both layers are active, and our interface allows you to inspect `pg_roles` live alongside our application users!*

### 2.2 System Catalog Alignment Matrix
| Layer | Stored In | Primary Key / Identifier | Purpose |
|---|---|---|---|
| **Tier 1: Application Profile** | `public.user_accounts` | `user_id SERIAL` | Clinician display name, role flag, account active status, audit references |
| **Tier 2: DBMS Engine DCL** | `pg_catalog.pg_user` & `pg_catalog.pg_roles` | `rolname` | Least-privilege schema permissions, table grant boundaries, SQL injection barriers |

---

## 3. Frontend UI/UX Design System Specification: "Next-Level Professional"

The frontend must look like a modern, life-like, high-end clinical operating system (inspired by Linear, Vercel, Epic Systems, and modern hospital SaaS).

### 3.1 Aesthetic & Visual Tokens
* **Theme:** Deep dark clinical aesthetic (`#0a0f1d` / `#0f172a` background) with subtle glassmorphism (`backdrop-filter: blur(12px)`), slate borders (`rgba(255, 255, 255, 0.08)`), and crisp high-contrast typography.
* **Palette:**
  * **Brand Primary:** Electric Indigo / Cyan (`#6366f1` / `#06b6d4`)
  * **Severity Indicators:** Major/Critical (`#ef4444` / Crimson glow), Moderate (`#f59e0b` / Amber glow), Minor (`#3b82f6` / Blue), Safe (`#10b981` / Emerald)
  * **DBMS Engine Actions:** Purple violet (`#8b5cf6` for PostgreSQL actions, `#0ea5e9` for Neo4j Cypher actions)
* **Micro-Interactions & Motion:**
  * Pill transitions on hover, pulse animations on active database operations, smooth expandable accordions for SQL query inspection.
  * Real-time execution timers showing query latency (e.g., `⚡ 4.2ms in PostgreSQL`).
* **Toast Notification System:**
  * Bottom-right notification toast stack for every database mutation (Insert, Update, Delete, Cascade, Constraint Exception).
  * Raw PostgreSQL error code display (e.g., `[PostgreSQL 23503: foreign_key_violation] ON DELETE RESTRICT enforced`).

### 3.2 Top-Level Navigation Architecture
The navigation header must feature 4 core sections:
1. **Clinical Hub (`/dashboard`):** Patient Cohort, active medication regimens, polypharmacy status, quick-add patient modal.
2. **Patient Detail & Screening (`/patients/[id]`):** Active prescriptions CRUD, dosage editor, interactive Neo4j force-directed graph visualizer, 1-to-3 hop traversal runner.
3. **Alerts & Audit Log (`/alerts`):** Persisted screening sessions, parent-child finding trees, audit metadata.
4. **DBMS Operations Studio (`/dbms-studio`):** Dedicated examiner console housing 6 interactive evaluation modules matching the PESU Level 3 rubric.

---

## 4. Detailed Specification: The 6 Modules of the DBMS Operations Studio (`/dbms-studio`)

The `/dbms-studio` page will be the centerpiece of the evaluation. It provides 6 dedicated tabs:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  DBMS OPERATIONS STUDIO — PES UNIVERSITY LEVEL 3 EVALUATION CONSOLE                                   │
├──────────────┬───────────────┬─────────────────┬──────────────────┬───────────────┬────────────────────┤
│ 1. CONSTRAINTS│ 2. TRIGGERS   │ 3. PROCEDURES   │ 4. ADVANCED SQL  │ 5. DDL/SCHEMA │ 6. DCL & ROLES     │
│    LAB       │    & AUDITS   │    & FUNCTIONS  │    & CTEs        │    STUDIO     │    (CREATE USER)   │
└──────────────┴───────────────┴─────────────────┴──────────────────┴───────────────┴────────────────────┘
```

---

### Module 1: Constraints Lab (`ON DELETE RESTRICT`, `ON DELETE CASCADE`, `CHECK`, `UNIQUE`)

This module allows the examiner to test all constraint violations and cascades live from the UI with zero command-line input.

#### A. `ON DELETE RESTRICT` Live Demonstration
* **Concept:** Attempting to delete a parent entity that is still referenced by child records with `ON DELETE RESTRICT` must be rejected by PostgreSQL.
* **UI Controls:**
  * Dropdown listing active drugs that have active prescriptions (e.g., `Drug #1: Warfarin`, `Drug #4: Amiodarone`).
  * Big Red Button: **"Attempt Deletion of Referenced Drug (`ON DELETE RESTRICT`)"**.
* **Frontend Trigger Action:**
  * Sends `DELETE /api/dbms/constraints/test-restrict` with `drug_id: 1`.
  * Backend runs: `DELETE FROM drugs WHERE drug_id = 1;`.
* **Database Behavior:**
  * PostgreSQL aborts transaction and raises Error Code `23503`:
    ```text
    ERROR: update or delete on table "drugs" violates foreign key constraint "fk_prescriptions_drug" on table "prescriptions"
    DETAIL: Key (drug_id)=(1) is still referenced from table "prescriptions".
    ```
* **UI State Presentation:**
  * Displays a highlighted Red Error Banner:
    > **🛡️ PostgreSQL Engine Rejection: `ON DELETE RESTRICT` Enforced**  
    > **SQL State:** `23503 (foreign_key_violation)`  
    > **Constraint:** `fk_prescriptions_drug` on table `prescriptions`  
    > **Engine Detail:** Relational integrity prevented deleting `warfarin` because Patient #1 has an active prescription.
* **Dual-Verification (pgAdmin 4):**
  ```sql
  SELECT drug_id, canonical_name FROM drugs WHERE drug_id = 1; -- Row still exists intact!
  ```

#### B. `ON DELETE CASCADE` Live Demonstration
* **Concept:** Deleting a parent patient automatically cascades and deletes all their child prescriptions, risk assessments, and assessment findings across 4 relational tables.
* **UI Controls:**
  * Section: "Synthetic Patient Cascade Sandbox".
  * Button: **"Spawn Ephemeral Test Patient with Child Records"** (Creates test patient `Test-Cascade-User` with 2 prescriptions, 1 assessment, and 2 findings).
  * Live Visual Hierarchy Card showing child counts:
    * `patients`: 1 record
    * `prescriptions`: 2 records
    * `risk_assessments`: 1 record
    * `assessment_findings`: 2 records
  * Dangerous Red Button: **"Delete Parent Patient (`ON DELETE CASCADE`)"**.
* **Frontend Trigger Action:**
  * Sends `DELETE /api/dbms/constraints/test-cascade?patient_id=<id>`.
  * Backend runs: `DELETE FROM patients WHERE patient_id = <id>;`.
* **Database Behavior:**
  * PostgreSQL cascades through:
    * `fk_prescriptions_patient` $\to$ removes 2 prescriptions
    * `fk_assessments_patient` $\to$ removes 1 assessment
    * `fk_findings_assessment` $\to$ removes 2 assessment findings
* **UI State Presentation:**
  * Live animation transitioning all counters from `[1, 2, 1, 2]` $\to$ `[0, 0, 0, 0]` in green badges with message:  
    > **✨ Automatic PostgreSQL Cascade Completed:** 1 patient, 2 prescriptions, 1 assessment, and 2 findings deleted atomically in 1 transaction via foreign key cascade rules.
* **Dual-Verification (pgAdmin 4):**
  ```sql
  SELECT count(*) FROM prescriptions WHERE patient_id = <ephemeral_id>; -- Returns 0
  SELECT count(*) FROM risk_assessments WHERE patient_id = <ephemeral_id>; -- Returns 0
  ```

#### C. `CHECK` Constraints Live Demonstration
* **UI Controls:**
  * Card: "Check Constraint Validation Sandbox".
  * Test 1: **Synthetic Patient Invariant (`CHECK is_synthetic = TRUE`)**:
    * Form with checkbox: `is_synthetic = FALSE`.
    * Click "Insert Real Patient Profile" $\to$ Backend attempts `INSERT INTO patients (..., is_synthetic) VALUES (..., FALSE);`.
    * UI displays PostgreSQL Error `23514`: `violates check constraint "ck_patient_synthetic"`.
  * Test 2: **Traversal Radius Bound (`CHECK max_hop_depth BETWEEN 1 AND 3`)**:
    * Input for `max_hop_depth`: set to `5`.
    * Click "Insert Assessment" $\to$ UI catches PostgreSQL Error `23514`: `violates check constraint "ck_assessment_hop_depth"`.
  * Test 3: **Canonical Pair Symmetrical Order (`CHECK drug_a_id < drug_b_id`)**:
    * Attempt inserting pair with `drug_a_id = 5` and `drug_b_id = 1` $\to$ UI catches Error `23514`: `violates check constraint "ck_pair_canonical_order"`.

---

### Module 2: Triggers & Automated Counters (`trg_assessment_findings_count`)

This module demonstrates active database triggers maintaining materialized summary counters with a verified **Before $\to$ Action $\to$ After** audit sequence.

* **Database Entities:**
  * Table `risk_assessments`: Columns `direct_interaction_count INT DEFAULT 0`, `multi_hop_candidate_count INT DEFAULT 0`.
  * Table `assessment_findings`: Event table.
  * Trigger: `trg_assessment_findings_count` executing `fn_update_assessment_counts()` `AFTER INSERT ON assessment_findings`.
* **UI Flow & Visual Layout:**
  1. **Before State Panel:**
     * Displays selected `assessment_id` (e.g. Session #101).
     * Shows live counters queried from `risk_assessments`:
       * `direct_interaction_count`: **`0`**
       * `multi_hop_candidate_count`: **`0`**
  2. **Action Controls:**
     * Button 1: **"Insert 1-Hop Direct Finding Row"** (Finding type: `DOCUMENTED_DIRECT`).
     * Button 2: **"Insert 2-Hop Candidate Pathway Row"** (Finding type: `CANDIDATE_PATHWAY`).
  3. **Trigger Execution:**
     * Backend executes raw SQL insert into `assessment_findings`.
     * PostgreSQL trigger `trg_assessment_findings_count` executes with `SECURITY DEFINER` privileges.
  4. **After State Panel (Immediate Live Re-render):**
     * Counter updates dynamically on screen:
       * If Direct: `direct_interaction_count` increments from **`0` $\to$ `1`** (glows emerald green).
       * If Multi-Hop: `multi_hop_candidate_count` increments from **`0` $\to$ `1`** (glows cyan).
     * UI presents an audit timeline card:  
       > `[TRIGGER FIRED: trg_assessment_findings_count] Function fn_update_assessment_counts() executed in 1.1ms. Parent assessment_id #101 synchronized.`
* **Dual-Verification (pgAdmin 4):**
  ```sql
  SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count 
  FROM risk_assessments WHERE assessment_id = 101;
  ```

---

### Module 3: Stored Functions & Procedures Runner

This module demonstrates stored database procedural logic executed entirely inside PostgreSQL.

* **Database Entity:**
  * `fn_perform_patient_direct_screening(p_patient_id INT, p_doctor_username VARCHAR, p_notes TEXT)`
* **UI Controls:**
  * Dropdown: Select Patient (e.g., `Patient 1: Robert Vance (3 drugs)`).
  * Input: Prescribing Clinician (`dr_sharma`).
  * Input: Clinical Audit Note (`Pre-operative polypharmacy screening`).
  * Big Purple Button: **"Invoke PL/pgSQL Function: `fn_perform_patient_direct_screening()`"**.
* **Frontend Trigger Action:**
  * Calls `/api/dbms/procedures/execute`.
  * Backend runs:
    ```sql
    SELECT * FROM fn_perform_patient_direct_screening($1, $2, $3);
    ```
* **UI State Presentation:**
  * Shows execution latency badge (e.g., `Executed on PostgreSQL in 8.4ms`).
  * Collapsible view: Displays full PL/pgSQL source code with syntax highlighting.
  * Live Interactive Results Table rendering returned tabular rows:
    * `assessment_id`: Generated session ID
    * `drug_a`: `warfarin`
    * `drug_b`: `amiodarone`
    * `severity`: `Major`
    * `mechanisms`: `Affected intra_extra-hepatic metabolism`
    * `sources`: `DDInter+MecDDI`
* **Dual-Verification (pgAdmin 4):**
  ```sql
  SELECT * FROM fn_perform_patient_direct_screening(1, 'dr_sharma', 'Manual pgAdmin test');
  ```

---

### Module 4: Advanced SQL Query Showcase & Graph CTE

This module features pre-configured, one-click execution runners for all required advanced queries from the DBMS Level 3 rubric (`04_required_queries.sql`).

Each query card includes:
1. Query Title & Rubric Marks category.
2. Syntax-highlighted SQL code editor/viewer.
3. One-click **"Execute Live on PostgreSQL"** button.
4. Execution latency badge.
5. Rendered tabular data grid.

#### Queries Included in Showcase:
1. **Multi-Table LEFT OUTER JOIN with Aggregation:**
   * Joins `ddi_pairs`, `drugs da`, `drugs db`, `ddi_severities`, `ddi_mechanisms` with `string_agg()`.
2. **SELF-JOIN on Prescriptions (Unordered Patient Medication Pairs):**
   * Joins `prescriptions pr1` and `prescriptions pr2` where `pr1.drug_id < pr2.drug_id` for Patient 1.
3. **Correlated Subquery with `EXISTS`:**
   * Finds drugs having at least one `Major` severity rating in `ddi_severities`.
4. **Nested Subquery with `IN`:**
   * Finds patients taking medications involved in metabolic interaction pathways.
5. **Analytical Window Function (`PARTITION BY` & `ROW_NUMBER()`):**
   * Computes sequential prescription order (`regimen_item_no`) and window total count per patient partition without collapsing rows.
6. **Analytical Window Function (`DENSE_RANK()`):**
   * Computes popularity ranking and relative percentage for mechanism categories.
7. **RECURSIVE Common Table Expression (CTE) — 2-Hop Graph Traversal in SQL:**
   * Demonstrates graph traversal inside relational PostgreSQL using recursive CTE to find:
     `warfarin` $\to$ `amiodarone (bridge)` $\to$ `simvastatin`.

---

### Module 5: DDL & Schema Studio ("Show Create Table" Live in UI)

This module satisfies the evaluator’s request for DDL commands and "Show Create Table" without touching terminal CLI or pgAdmin.

#### A. Table Catalog & Column Inspector
* Dropdown to select any of the 10 tables:
  `patients`, `drugs`, `prescriptions`, `ddi_pairs`, `ddi_severities`, `ddi_mechanisms`, `drug_source_mappings`, `risk_assessments`, `assessment_findings`, `user_accounts`.
* **Interactive Table Structure Grid:**
  * Queries `information_schema.columns` to display:
    * Column Name
    * Data Type
    * Nullability
    * Default Value
    * Key Status (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`)

#### B. "Show Create Table" DDL Generator
* A dedicated code panel that reconstructs or dumps the exact raw `CREATE TABLE` DDL statement for the selected table.
* Queries `pg_constraint`, `pg_attribute`, and `information_schema` to produce the full statement including table-level checks (`CHECK (is_synthetic = TRUE)`), primary keys, and foreign keys with `ON DELETE CASCADE / RESTRICT`.
* Features a one-click **"Copy DDL"** button.

#### C. Live Constraints Catalog
* Queries `pg_constraint` to list all 41 constraints across the database, filterable by table and type (`CHECK`, `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`).

---

### Module 6: DCL, Engine Roles & User Management (`CREATE USER` + `GRANT`)

This module directly addresses the reviewer’s critique about users and roles.

#### A. Interactive User Creation Form (Executes Real DCL)
* **Form Inputs:**
  * Username: `[ dr_kapoor ]`
  * Full Name: `[ Dr. Anita Kapoor, MD ]`
  * Temporary Password: `[ DoctorPass#2026 ]`
  * Role Assignment: `role_doctor (Clinician)` OR `role_admin (Administrator)`
* **Backend Action on Submission (`POST /api/admin/users`):**
  The server executes a multi-statement transaction:
  ```sql
  -- 1. Create native PostgreSQL engine login user (DCL)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dr_kapoor') THEN
      CREATE USER dr_kapoor WITH PASSWORD 'DoctorPass#2026';
    END IF;
  END $$;

  -- 2. Grant PostgreSQL role membership (DCL)
  GRANT role_doctor TO dr_kapoor;

  -- 3. Store application profile in user_accounts table
  INSERT INTO user_accounts (username, password_hash, full_name, role, is_active)
  VALUES ('dr_kapoor', $hashed_password, 'Dr. Anita Kapoor, MD', 'DOCTOR', TRUE);
  ```
* **UI Feedback:**
  * Displays syntax-highlighted code block of the exact SQL DCL statements executed.
  * Toast notification: `User dr_kapoor created in PostgreSQL engine with role role_doctor`.

#### B. Side-by-Side Dual Catalog Viewer
Displays two live tables side-by-side to prove both layers exist:
* **Left Table: PostgreSQL Engine Catalog (`pg_catalog.pg_roles` & `pg_catalog.pg_user`):**
  * Displays: `usename`, `usesysid`, `rolcanlogin`, `memberof` (e.g. `role_doctor`).
* **Right Table: Application Profile Table (`public.user_accounts`):**
  * Displays: `user_id`, `username`, `full_name`, `role`, `is_active`, `created_at`.

#### C. Live RBAC Security Boundary Test Button
* Button: **"Test Least-Privilege Access as `role_doctor`"**.
* Action: Backend connects to PostgreSQL as `app_doctor_user` (or executes with `SET ROLE role_doctor`) and attempts:
  ```sql
  SELECT * FROM user_accounts;
  ```
* Result: PostgreSQL engine blocks the query and raises Error `42501`:
  ```text
  ERROR: permission denied for table user_accounts
  SQL state: 42501
  ```
* UI Presentation: Displays an authenticated green security shield:
  > **🛡️ PostgreSQL Engine Security Verified:** `role_doctor` was denied access to user credentials by PostgreSQL internal access controls.

---

## 5. Clinical Pages Enhancements: Full CRUD & Neo4j Interaction

In addition to the `/dbms-studio`, the existing clinical workflow pages must be upgraded with full CRUD and life-like interactivity.

### 5.1 Patient Cohort Dashboard (`/dashboard`)
* **Add Patient Modal:**
  * Button at top: **"+ Add New Synthetic Patient"**.
  * Form: Full Name, MRN (`SYN-PAT-XXXX`), Gender, Date of Birth, Primary Condition.
  * On submit: Runs `INSERT INTO patients ... RETURNING *`.
  * Dashboard stat cards (`Total Patients`, `Active Regimen Drugs`) update instantly without page reload.
* **Edit Patient Modal:**
  * Edit patient demographics (Full Name, Primary Condition).
  * Executes `UPDATE patients SET ... WHERE patient_id = ...`.
* **Delete Patient Button:**
  * Delete patient with confirmation dialog explaining cascade deletion.

### 5.2 Patient Detail & Regimen Page (`/patients/[id]`)
* **Add Prescription Form:**
  * Direct modal or inline form:
    * Select Drug from master drug registry (`drugs` table).
    * Dosage input (e.g., `25mg`).
    * Frequency input (e.g., `Twice daily`).
    * Start Date picker.
  * Submits `POST /api/prescriptions` $\to$ inserts into `prescriptions`.
  * Regimen table re-renders instantly.
* **Update Prescription Dosage:**
  * One-click editable dosage badge (click `5mg` $\to$ change to `10mg` $\to$ executes `UPDATE prescriptions SET dosage = ...`).
* **Discontinue Prescription Button:**
  * Updates status to `DISCONTINUED` or runs `DELETE`.

### 5.3 Embedded Interactive Neo4j Graph Visualizer
* On `/patients/[id]`, beneath the interaction findings cards, embed a live force-directed graph canvas (using Cytoscape.js, Force-Graph, or Neo4j NVL / SVG renderer).
* Nodes: Active prescribed drugs (blue) + Discovered bridge drugs (amber) + Target interaction drugs (red).
* Edges: `INTERACTS_WITH` relationships labeled with severity (`Major`, `Moderate`).
* Users can click and drag nodes with physics animation matching the Neo4j Browser experience!

### 5.4 Neo4j Graph RUD (NoSQL CRUD from Frontend)
* Under a "Graph Maintenance" section or in `/dbms-studio`:
  * **Create (C):** Add a custom interaction edge between two drugs via Cypher `MERGE`.
  * **Read (R):** Fetch star ego-network for any selected drug.
  * **Update (U):** Update interaction edge severity or mechanism property via Cypher `SET`.
  * **Delete (D):** Remove an interaction edge via Cypher `DELETE`.
  * *Verification:* Evaluator can refresh Neo4j browser at `http://localhost:7474` and see the edge added/modified/deleted.

---

## 6. Technical Architecture & File Modifications Plan

### 6.1 Backend API Routes to Implement
The following Next.js Route Handlers (`app/api/...`) must be created or updated:

1. **`app/api/dbms/schema/route.ts` (GET):**
   * Queries `information_schema` and `pg_constraint` to return tables, columns, indexes, and full `CREATE TABLE` DDL scripts.
2. **`app/api/dbms/constraints/test-restrict/route.ts` (POST, DELETE):**
   * Attempts to delete referenced drug (ID=1) and catches/returns raw PostgreSQL error code `23503`.
3. **`app/api/dbms/constraints/test-cascade/route.ts` (POST, DELETE):**
   * POST creates an ephemeral test patient with child records; DELETE deletes the patient and returns before/after row count audit.
4. **`app/api/dbms/triggers/demo/route.ts` (GET, POST):**
   * GET returns parent assessment session counters; POST inserts a finding row and returns updated parent counters.
5. **`app/api/dbms/procedures/execute/route.ts` (POST):**
   * Invokes `fn_perform_patient_direct_screening(p_patient_id, p_doctor_username, p_notes)` and returns execution time and rows.
6. **`app/api/dbms/queries/execute/route.ts` (POST):**
   * Accepts query ID (1 to 7) and executes the corresponding SQL query from `04_required_queries.sql`, returning execution latency and rows.
7. **`app/api/dbms/roles/route.ts` (GET, POST):**
   * GET queries `pg_roles` and `pg_user`; POST tests `role_doctor` security boundary on `user_accounts`.
8. **`app/api/patients/route.ts` (POST) & `app/api/patients/[id]/route.ts` (PUT, DELETE):**
   * Full CRUD handlers for patients.
9. **`app/api/prescriptions/route.ts` (POST, PUT, DELETE):**
   * Full CRUD handlers for prescriptions.
10. **`app/api/neo4j/graph-rud/route.ts` (GET, POST, PUT, DELETE):**
    * Full CRUD handlers executing Cypher queries directly on Neo4j for node/edge manipulation.

### 6.2 Frontend Pages and Components to Implement
1. **`app/dbms-studio/page.tsx`:** The comprehensive 6-tab evaluation studio.
2. **`components/Navbar.tsx`:** Add link to `DBMS Studio` (styled with a prominent badge: `⚡ DBMS Studio (Rubric Demo)`).
3. **`components/ui/Toast.tsx`:** Global toast alert context for database operation feedback.
4. **`components/ui/SqlCodeViewer.tsx`:** Clean dark-mode code viewer with syntax highlighting and copy button.
5. **`components/graph/InteractionGraphViewer.tsx`:** Force-directed graph visualizer component for patient screening paths.
6. **`components/modals/AddPatientModal.tsx`:** Modal for patient creation.
7. **`components/modals/AddPrescriptionModal.tsx`:** Modal for prescription creation.

---

## 7. Dual-Verification Playbook (Frontend Action $\longleftrightarrow$ pgAdmin / Neo4j Query)

This table defines the exact query to run in pgAdmin 4 or Neo4j browser for every action demonstrated in the frontend:

| Rubric Feature | Frontend Action in UI | Behind-the-Scenes Database Mutation | Dual-Verification Command in pgAdmin 4 / Neo4j |
|---|---|---|---|
| **DML Insert** | Fill "Add Patient" form with `Diana Prince` | `INSERT INTO patients ...` | `SELECT * FROM patients WHERE full_name = 'Diana Prince';` |
| **DML Update** | Click dosage badge to change `5mg` $\to$ `20mg` | `UPDATE prescriptions SET dosage = '20mg' ...` | `SELECT dosage FROM prescriptions WHERE prescription_id = <id>;` |
| **DML Delete** | Click "Delete Patient" on Diana Prince | `DELETE FROM patients WHERE mrn = ...` | `SELECT count(*) FROM patients WHERE mrn = 'SYN-PAT-1005';` (Returns 0) |
| **ON DELETE RESTRICT** | Click "Delete Drug: Warfarin" in Constraints Lab | Backend runs `DELETE FROM drugs WHERE drug_id = 1;` | Shows error 23503 in UI. Verify in pgAdmin: `SELECT * FROM drugs WHERE drug_id = 1;` (Row remains intact). |
| **ON DELETE CASCADE** | Click "Delete Ephemeral Patient" in Constraints Lab | Backend runs `DELETE FROM patients WHERE patient_id = <id>;` | `SELECT count(*) FROM prescriptions WHERE patient_id = <id>;` (Returns 0). |
| **Trigger Demo** | Click "Insert Finding Row" in Triggers Tab | `INSERT INTO assessment_findings ...` fires `trg_assessment_findings_count` | `SELECT direct_interaction_count FROM risk_assessments WHERE assessment_id = <id>;` (Changed from 0 to 1). |
| **Stored Function** | Click "Invoke Direct Screening" in Procedures Tab | Executes `fn_perform_patient_direct_screening(1, 'dr_sharma')` | `SELECT * FROM fn_perform_patient_direct_screening(1, 'dr_sharma');` |
| **Recursive CTE** | Click "Run 2-Hop Graph Traversal in SQL" | Executes recursive CTE matching Warfarin to Simvastatin | Paste query 6.2 from `04_required_queries.sql` in pgAdmin query tool. |
| **DCL / CREATE USER** | Submit "Add Doctor Account" form with `dr_kapoor` | Executes `CREATE USER dr_kapoor` and `GRANT role_doctor` | `SELECT usename FROM pg_user WHERE usename = 'dr_kapoor';` |
| **RBAC Barrier** | Click "Test Least Privilege as Doctor" | Attempts `SELECT * FROM user_accounts` as `app_doctor_user` | `SET ROLE role_doctor; SELECT * FROM user_accounts;` (Throws Error 42501). |
| **Neo4j Graph RUD** | Add test edge between Warfarin and Aspirin in UI | Cypher: `MATCH (a:Drug {drug_id:1}), (b:Drug {drug_id:2}) CREATE (a)-[:TEST_INTERACTION]->(b)` | In Neo4j Browser: `MATCH (a:Drug)-[r:TEST_INTERACTION]->(b:Drug) RETURN a, r, b;` |

---

## 8. Step-by-Step Implementation Roadmap for Teammate & Agent

To execute this project cleanly with zero regressions on existing code, follow this sequence:

### Phase 1: Server-Side API Handlers & Database Client Extensions
1. Extend `lib/postgres/client.ts` to support ad-hoc DCL execution (`CREATE USER`, `GRANT`) using administrative credentials when authorized.
2. Build the dedicated `/api/dbms/...` route handlers detailed in Section 6.1.
3. Build the full CRUD route handlers for `/api/patients` and `/api/prescriptions`.
4. Ensure all database errors (e.g. 23503, 23514, 42501) return structured JSON payloads with `errorCode`, `errorDetail`, and `constraintName`.

### Phase 2: Design System & Shared Visual Components
1. Add global styling variables for glassmorphism, glowing badges, and sleek code blocks to `app/globals.css`.
2. Build reusable components: `SqlCodeViewer`, `ToastNotification`, `StatBadge`, `ModalSheet`.
3. Update `components/Navbar.tsx` to include `DBMS Studio` with an eye-catching evaluation badge.

### Phase 3: Build the DBMS Operations Studio (`app/dbms-studio/page.tsx`)
1. Implement the 6 evaluation tabs:
   * Tab 1: Constraints Lab (Restrict, Cascade, Check sandbox).
   * Tab 2: Triggers & Automated Audit Counters (Before & After visualizer).
   * Tab 3: Stored Procedures & Functions Runner (Parameter form + execution latency).
   * Tab 4: Advanced SQL & Recursive CTE Showcase (One-click execution of all 7 rubric queries).
   * Tab 5: DDL & Schema Studio (Table selector, column inspector, "Show Create Table" generator).
   * Tab 6: DCL, Engine Roles & User Management (`CREATE USER`, `pg_roles` live catalog, least-privilege barrier test).

### Phase 4: Upgrade Clinical Hub (`/dashboard` & `/patients/[id]`)
1. Add "Add Synthetic Patient" modal on `/dashboard`.
2. Add "Add Medication Order" modal on `/patients/[id]`.
3. Integrate an interactive force-directed graph viewer on `/patients/[id]` showing discovered multi-hop pathways.
4. Add live dosage editing micro-interactions.

### Phase 5: Verification & Automated Test Suite Run
1. Run existing integration tests (`npm run test:integration`, `npm run test:auth`, `python3 -m unittest discover tests/unit/`) to guarantee all 67 existing test assertions remain 100% passing.
2. Add test assertions verifying that creating a user triggers PostgreSQL `CREATE USER` and `GRANT`.
3. Verify that all 6 modules of `/dbms-studio` execute cleanly in the browser.

---

## 9. Final Definition of Done (Acceptance Criteria)

This implementation is considered complete when:
1. **Zero pgAdmin Dependency:** The student can present the entire 50-mark viva strictly from the Next.js frontend without opening pgAdmin 4 or terminal once.
2. **Reviewer Critique Satisfied:**
   * Adding a user visibly executes PostgreSQL DCL (`CREATE USER`, `GRANT`) and reflects live in `pg_roles`.
   * The Two-Tier Architecture is clearly articulated and visually proven.
3. **Constraints Provable on Screen:**
   * `ON DELETE RESTRICT` visibly catches PostgreSQL error `23503` in a styled banner.
   * `ON DELETE CASCADE` visibly cascades across 4 tables with live counter decrement.
4. **Triggers Provable on Screen:**
   * Inserting a finding visibly updates parent assessment counters from `0` $\to$ `1` with before/after audit badges.
5. **NoSQL Fully Integrated:**
   * Multi-hop traversal and Neo4j graph nodes/edges are rendered and manipulated directly in the web UI.
6. **Aesthetics:**
   * The UI looks exceptionally polished, modern, life-like, and worthy of full marks (50/50).
7. **Strict Bidirectional End-to-End Ground Truth:**
   * Zero mock data or client-only fake timeouts. Every single action in the frontend communicates directly with PostgreSQL and Neo4j.
   * If an action is performed in the frontend, verifying in pgAdmin 4 or Neo4j Browser immediately shows the persisted record.
   * If an action is performed in pgAdmin 4 or Neo4j Browser, refreshing the frontend immediately reflects the updated state. Both systems remain 100% in sync at all times.

