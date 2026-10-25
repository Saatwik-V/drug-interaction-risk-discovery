# Live Viva Demonstration Execution Guide
## Ordered by Official DBMS Level 3 Evaluation Rubric (50 Marks)

> **Authority Document:** Second Table of [`docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf)  
> **How to Use:** Follow each section in order (1 through 14). Copy the command, run it in the specified window, and explain the output shown on screen.

---

### 0. Pre-Flight Setup (Open These Before Evaluation)

Open **two terminal windows**:
```bash
# Terminal 1: Ensure background databases are up and healthy
docker compose up -d
docker compose ps
```
```bash
# Terminal 2: Start the Next.js web application
npm run dev
```

Have these windows open on your screen:
1. **Next.js Web App:** `http://localhost:3000`
2. **pgAdmin 4:** Connected to `localhost:5432` (`drug_interaction_db`) with **Query Tool** open
3. **Neo4j Browser:** `http://localhost:7474` (User: `neo4j`, Password: `password123`)

---

# 1. ER diagram (2 Marks)

* **📍 WHERE TO OPEN:** PDF Viewer / File Explorer  
* **📋 FILE TO SHOW:** [`docs/database-design/ER_Diagram_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf) (or `.png`)  
* **💡 WHAT IT DOES:** Displays the formal Peter Chen conceptual ER diagram representing the biomedical polypharmacy domain.  
* **🎯 EXPECTED OUTPUT ON SCREEN:**
  * 10 Entity Sets (rectangles): `DRUG`, `DRUG_SOURCE_MAPPING`, `DDI_PAIR`, `DDI_SEVERITY`, `DDI_MECHANISM`, `PATIENT`, `PRESCRIPTION`, `RISK_ASSESSMENT`, `ASSESSMENT_FINDING`, `USER_ACCOUNT`.
  * 12 Relationship Sets (diamonds): `<MAPPED_TO>`, `<DRUG_A_IN_PAIR>`, `<DRUG_B_IN_PAIR>`, `<HAS_SEVERITY>`, `<HAS_MECHANISM>`, `<RECEIVES>`, `<PRESCRIBES>`, `<UNDERGOES>`, `<PRODUCES>`, `<FIND_DRUG_A>`, `<FIND_DRUG_B>`, and dashed `<PERFORMED_BY>`.
  * Explicit `(min, max)` structural constraints with total participation `(1,1)` on child tables.
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“Our ER diagram uses standard Peter Chen notation with 10 entities and 12 relationships. Child entities enforce total participation `(1,1)`, and `<UNDERGOES>` links patients directly to risk assessments to evaluate their multi-drug regimens.”*

---

# 2. Relational schema with keys, relationships, and constraints (3 Marks)

* **📍 WHERE TO OPEN:** PDF Viewer / File Explorer  
* **📋 FILE TO SHOW:** [`docs/database-design/Relational_Schema_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf) (or `.png`)  
* **💡 WHAT IT DOES:** Shows the normalized logical relational schema diagram mapping tables, primary keys, and foreign keys.  
* **🎯 EXPECTED OUTPUT ON SCREEN:**
  * All 10 tables organized in **BCNF** and **4NF** (severities and mechanisms separated to prevent multi-valued redundancy).
  * All 10 primary keys are explicitly underlined.
  * Exactly **11 physical foreign-key connector arrows** pointing from child tables to parent tables.
  * Attributes marked with `(U)` for UNIQUE and `(O)` for Optional/Nullable.
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“Our relational schema is normalized to BCNF and 4NF. It has exactly 11 physical foreign-key connectors matching our SQL DDL. We enforce canonical check constraints like `drug_a_id < drug_b_id` to prevent duplicate symmetric pairs `(A, B)` and `(B, A)`.”*

---

# 3. SQL database implementation-DDL with constraints (4 Marks)

* **📍 WHERE TO RUN:** **pgAdmin 4 — Query Tool**  
* **📋 COMMAND TO RUN:**
```sql
-- 1. Verify all 10 physical tables and column counts in PostgreSQL
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```
* **💡 WHAT IT DOES:** Queries PostgreSQL's `information_schema` to prove all 10 base tables are physically created in the database.
* **🎯 EXPECTED OUTPUT ON SCREEN:** Grid listing 10 tables (`assessment_findings`, `ddi_mechanisms`, `ddi_pairs`, `ddi_severities`, `drug_source_mappings`, `drugs`, `patients`, `prescriptions`, `risk_assessments`, `user_accounts`).

---

* **📋 COMMAND TO RUN (Inspect All 41 Constraints Across All Tables):**
```sql
-- 2. Inspect all Primary Keys, Foreign Keys, Unique Keys, and Check Constraints
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
    END AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY table_name, constraint_type;
```
* **💡 WHAT IT DOES:** Queries PostgreSQL's internal system catalog (`pg_constraint`) to return all 41 constraints with their exact SQL definitions (e.g., `CHECK (drug_a_id < drug_b_id)`, `CHECK (is_synthetic = true)`, `REFERENCES drugs(drug_id)`).
* **🎯 EXPECTED OUTPUT ON SCREEN:** 41 rows neatly grouped by table, type, and rule definition.

---

* **📋 COMMAND TO RUN (Live CHECK Constraint Demonstration):**
```sql
-- 2. Demonstrate that check constraint strictly blocks real patient records:
INSERT INTO patients (mrn, full_name, gender, date_of_birth, primary_condition, is_synthetic)
VALUES ('REAL-PAT-001', 'Real Patient Example', 'Male', '1980-01-01', 'Hypertension', FALSE);
```
* **💡 WHAT IT DOES:** Tries to insert a patient where `is_synthetic = FALSE`.
* **🎯 EXPECTED OUTPUT ON SCREEN:**
  ```text
  ERROR: new row for relation "patients" violates check constraint "ck_patient_synthetic"
  ```
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“Our DDL enforces strict constraints: foreign keys maintain referential integrity, and table-level check constraints guarantee that only synthetic patient data can exist in the system.”*

---

# 4. NoSQL/Vector database creation (4 Marks)

* **📍 WHERE TO RUN:** **Neo4j Browser** (`http://localhost:7474`)  
* **📋 COMMAND TO RUN:**
```cypher
// Show database uniqueness constraints and node counts
SHOW CONSTRAINTS;
```
* **💡 WHAT IT DOES:** Shows that Neo4j has active uniqueness constraints and schema indexing created.
* **🎯 EXPECTED OUTPUT ON SCREEN:** Table showing constraint `constraint_drug_id` on `:Drug(drug_id)` with status `ONLINE`.

---

```cypher
MATCH (d:Drug)
RETURN count(d) AS total_drug_nodes;
```
* **💡 WHAT IT DOES:** Counts the active drug entities in the graph database.
* **🎯 EXPECTED OUTPUT ON SCREEN:** Node count (10 demonstration drugs).

---

* **📋 COMMAND TO RUN (Inspect a Sample Drug Node):**
```cypher
MATCH (d:Drug {canonical_name: 'amiodarone'})
RETURN d;
```
* **💡 WHAT IT DOES:** Fetches a sample drug node using the exact property `canonical_name` to inspect its properties (`pubchem_cid`, `therapeutic_class`, `drug_type`).
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“We implemented a native NoSQL Property Graph in Neo4j 5 with uniqueness constraints on Drug IDs, indexed properties, and typed biomedical entities.”*

---

# 5. Technology justification (1 Mark)

* **📍 WHERE TO SHOW:** Verbal Defense (or show [`docs/database-design/TECHNOLOGY_JUSTIFICATION.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/TECHNOLOGY_JUSTIFICATION.md))  
* **🗣️ WHAT TO SAY TO EXAMINER (Verbatim 30-Second Justification):**  
  *“We use a polyglot persistence architecture. **PostgreSQL** handles ACID transactions, synthetic patient records, and immutable clinical audits where relational integrity is critical. **Neo4j** handles multi-hop graph path discovery. Finding 2-hop and 3-hop interactions in SQL requires expensive recursive table self-joins ($O(N^2)$), whereas Neo4j uses **index-free adjacency** where relationships are stored as direct double-linked pointers, traversing multi-hop bridges in $O(1)$ memory dereferences.”*

---

# 6. DML operations (4 Marks)

* **📍 WHERE TO RUN:** **pgAdmin 4 — Query Tool**  
* Run these 4 standard DML operations sequentially:

#### A. INSERT: Prescribe a New Medication
```sql
INSERT INTO prescriptions (patient_id, drug_id, dosage, frequency, status, prescribed_by, start_date)
VALUES (2, 8, '10mg', 'Once daily', 'ACTIVE', 'dr_sharma', CURRENT_DATE)
RETURNING prescription_id, patient_id, drug_id, dosage, status;
```
* **🎯 OUTPUT:** Returns newly generated `prescription_id` confirming insertion.

#### B. SELECT: Query Active Prescriptions with Joins
```sql
SELECT p.full_name AS patient, d.canonical_name AS drug, pr.dosage, pr.frequency, pr.status
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.patient_id
JOIN drugs d ON pr.drug_id = d.drug_id
WHERE pr.patient_id = 2 AND pr.status = 'ACTIVE';
```
* **🎯 OUTPUT:** Grid showing patient name, canonical drug name, dosage, and active status.

#### C. UPDATE: Modify Dosage
```sql
UPDATE prescriptions
SET dosage = '20mg'
WHERE patient_id = 2 AND drug_id = 8 AND status = 'ACTIVE'
RETURNING prescription_id, dosage, status;
```
* **🎯 OUTPUT:** Returns updated row with dosage changed to `20mg`.

#### D. DELETE: Remove the Test Prescription (Self-Cleaning)
```sql
DELETE FROM prescriptions
WHERE patient_id = 2 AND drug_id = 8
RETURNING prescription_id, patient_id, drug_id;
```
* **💡 WHY THIS IS GREAT:** It satisfies the explicit SQL `DELETE` keyword requirement in the rubric AND immediately cleans up the test row, meaning **you can re-run this entire DML section as many times as you want without causing duplicate key errors!**
* **🎯 OUTPUT:** Returns the deleted row confirming removal from the database.

---

# 7. Nested/correlated/Recursive Queries, Join SQL queries (4 Marks)

* **📍 WHERE TO RUN:** **pgAdmin 4 — Query Tool**  

#### A. Multi-Table LEFT OUTER JOIN (Pairs + Severities + Mechanisms)
```sql
SELECT da.canonical_name AS drug_a, db.canonical_name AS drug_b,
       COALESCE(ds.severity_level, 'Not Reported') AS severity,
       COALESCE(string_agg(DISTINCT dm.mechanism_category, '; '), 'General Interaction') AS mechanisms
FROM ddi_pairs dp
JOIN drugs da ON dp.drug_a_id = da.drug_id
JOIN drugs db ON dp.drug_b_id = db.drug_id
LEFT JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
LEFT JOIN ddi_mechanisms dm ON dp.pair_id = dm.pair_id
GROUP BY da.canonical_name, db.canonical_name, ds.severity_level
LIMIT 5;
```
* **🎯 OUTPUT:** Table combining pairs, severities, and mechanisms across multi-table outer joins.

#### B. SELF-JOIN: Unordered Regimen Pairs for Patient 1
```sql
SELECT p.full_name AS patient, d1.canonical_name AS drug_1, d2.canonical_name AS drug_2
FROM prescriptions pr1
JOIN prescriptions pr2 ON pr1.patient_id = pr2.patient_id AND pr1.drug_id < pr2.drug_id
JOIN patients p ON pr1.patient_id = p.patient_id
JOIN drugs d1 ON pr1.drug_id = d1.drug_id
JOIN drugs d2 ON pr2.drug_id = d2.drug_id
WHERE pr1.status = 'ACTIVE' AND pr2.status = 'ACTIVE' AND p.patient_id = 1;
```
* **🎯 OUTPUT:** Generates all unique combinations of active drugs for Patient 1 (`Warfarin - Amiodarone`, `Warfarin - Simvastatin`, `Amiodarone - Simvastatin`).

#### C. Correlated Subquery with `EXISTS`
```sql
SELECT d.canonical_name, d.therapeutic_class
FROM drugs d
WHERE EXISTS (
    SELECT 1 FROM ddi_pairs dp
    JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
    WHERE (dp.drug_a_id = d.drug_id OR dp.drug_b_id = d.drug_id)
      AND ds.severity_level = 'Major'
)
LIMIT 5;
```
* **🎯 OUTPUT:** Returns drugs that have at least one Major severity interaction.

#### D. Nested Subquery with `IN`
```sql
SELECT p.mrn, p.full_name, p.primary_condition
FROM patients p
WHERE p.patient_id IN (
    SELECT pr.patient_id FROM prescriptions pr
    WHERE pr.status = 'ACTIVE' AND pr.drug_id IN (
        SELECT dp.drug_a_id FROM ddi_pairs dp
        JOIN ddi_mechanisms dm ON dp.pair_id = dm.pair_id
        WHERE dm.mechanism_category = 'Affected intra_extra-hepatic metabolism'
    )
);
```
* **🎯 OUTPUT:** Returns patients actively prescribed drugs involved in hepatic metabolism interactions.

#### E. RECURSIVE Common Table Expression (CTE) — 2-Hop Graph Traversal in Pure SQL
```sql
WITH RECURSIVE GraphPaths AS (
    -- Anchor: 1-hop direct edges from Warfarin (drug_id = 1)
    SELECT dp.drug_a_id AS current_drug, dp.drug_b_id AS next_drug, 1 AS depth, 
           ARRAY[dp.drug_a_id, dp.drug_b_id] AS path_nodes
    FROM ddi_pairs dp WHERE dp.drug_a_id = 1
    UNION ALL
    SELECT dp.drug_b_id AS current_drug, dp.drug_a_id AS next_drug, 1 AS depth, 
           ARRAY[dp.drug_b_id, dp.drug_a_id] AS path_nodes
    FROM ddi_pairs dp WHERE dp.drug_b_id = 1
    UNION ALL
    -- Recursive: extend to 2 hops
    SELECT gp.next_drug, 
           CASE WHEN dp.drug_a_id = gp.next_drug THEN dp.drug_b_id ELSE dp.drug_a_id END, 
           gp.depth + 1,
           gp.path_nodes || CASE WHEN dp.drug_a_id = gp.next_drug THEN dp.drug_b_id ELSE dp.drug_a_id END
    FROM GraphPaths gp
    JOIN ddi_pairs dp ON dp.drug_a_id = gp.next_drug OR dp.drug_b_id = gp.next_drug
    WHERE gp.depth < 2 
      AND NOT (CASE WHEN dp.drug_a_id = gp.next_drug THEN dp.drug_b_id ELSE dp.drug_a_id END = ANY(gp.path_nodes))
)
SELECT d_start.canonical_name AS start_drug, d_mid.canonical_name AS bridge_drug, 
       d_end.canonical_name AS target_drug, gp.depth AS hops
FROM GraphPaths gp
JOIN drugs d_start ON d_start.drug_id = gp.path_nodes[1]
JOIN drugs d_mid ON d_mid.drug_id = gp.path_nodes[2]
JOIN drugs d_end ON d_end.drug_id = gp.path_nodes[3]
WHERE gp.depth = 2 AND d_end.canonical_name = 'simvastatin';
```
* **🎯 OUTPUT:** Returns `start_drug: warfarin`, `bridge_drug: amiodarone`, `target_drug: simvastatin`, `hops: 2`.

---

# 8. Advanced SQL concepts (Procedure/function, trigger, CTE) (6 Marks)

* **📍 WHERE TO RUN:** **pgAdmin 4 — Query Tool**  

#### A. Stored Function / Procedure Call
```sql
SELECT * FROM fn_perform_patient_direct_screening(1, 'dr_sharma'::varchar);
```
* **💡 WHAT IT DOES:** Executes the stored function `fn_perform_patient_direct_screening()`, transactionally inserting an assessment header and finding rows, and returning the results table.
* **🎯 OUTPUT:** Grid showing direct findings between Warfarin, Amiodarone, and Simvastatin.

#### B. Database Trigger Demonstration (Atomic Counter Maintenance)
Run this 3-step sequence in the Query Tool:
```sql
-- Step 1: Create a new assessment session header (counters start at 0)
INSERT INTO risk_assessments (patient_id, performed_by, max_hop_depth, total_active_medications, assessment_notes)
VALUES (1, 'dr_sharma', 2, 3, 'Rubric 8 Trigger Demo')
RETURNING assessment_id, direct_interaction_count, multi_hop_candidate_count;
-- (Note the returned assessment_id, e.g. 100)

-- Step 2: Insert ONE finding row for this assessment
INSERT INTO assessment_findings (
    assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path,
    severity_level, evidence_sources, finding_type
) VALUES (
    (SELECT MAX(assessment_id) FROM risk_assessments), 1, 4, 1, 
    'warfarin <-> amiodarone', 'Major', 'DDInter', 'DOCUMENTED_DIRECT'
);

-- Step 3: Observe that the trigger automatically incremented direct_interaction_count to 1!
SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count, assessment_notes
FROM risk_assessments
ORDER BY assessment_id DESC LIMIT 1;
```
* **🎯 OUTPUT IN PGADMIN:** Grid showing `direct_interaction_count` changed from `0` $\to$ `1` automatically via trigger `trg_assessment_findings_count`!

*(Optional: Once you are done showing the examiner or finishing your practice, run this cleanup command to keep your database tidy)*:
```sql
DELETE FROM risk_assessments WHERE assessment_notes = 'Rubric 8 Trigger Demo';
```

#### C. Analytical SQL: Window Function (`PARTITION BY` with `ROW_NUMBER` & Window Aggregate)
```sql
SELECT 
    p.full_name AS patient,
    d.canonical_name AS drug,
    pr.dosage,
    pr.start_date,
    ROW_NUMBER() OVER (PARTITION BY pr.patient_id ORDER BY pr.start_date ASC, pr.prescription_id) AS regimen_item_no,
    COUNT(*) OVER (PARTITION BY pr.patient_id) AS total_active_meds
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.patient_id
JOIN drugs d ON pr.drug_id = d.drug_id
WHERE pr.status = 'ACTIVE'
ORDER BY pr.patient_id, regimen_item_no;
```
* **💡 WHAT IT DOES:** Demonstrates the true power of Window Functions using `OVER (PARTITION BY pr.patient_id)`. It computes a sequential prescription index (`regimen_item_no`) and window total (`total_active_meds`) for each patient **without collapsing rows like `GROUP BY` does**.
* **🎯 OUTPUT IN PGADMIN:** 11 rows showing each patient's regimen (e.g. Robert Vance items 1, 2, 3 with total 3; Sarah Jenkins items 1, 2 with total 2).
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“Unlike `GROUP BY` which collapses rows, our window function uses `PARTITION BY patient_id` to compute sequential regimen numbering and partition-level totals while preserving every individual prescription row.”*

---

# 9. NoSQL/Vector feature, RUD (7 Marks)

* **📍 WHERE TO RUN:** **Neo4j Browser** (`http://localhost:7474`)  

#### A. Visual Interactive Graph Rendering
```cypher
MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug)
RETURN d1, r, d2
LIMIT 30;
```
* **🎯 WHAT WILL APPEAR ON SCREEN:** A stunning, animated, physics-based force-directed graph with floating circular nodes and curved relationship arrows!
* **✨ HOW TO MAKE IT LOOK AMAZING IN 3 SECONDS:**
  1. Click on any circular node (or click the `(*)` / `:Drug` badge at the top).
  2. In the bottom styling bar, click **`canonical_name`** under *Caption*. Instantly, the drug names (`warfarin`, `amiodarone`, `simvastatin`, `aspirin`, etc.) appear inside each bubble!
  3. Pick a vibrant color (e.g., bright purple or teal) and drag the node size slider.
  4. **Click and drag any node with your mouse** across the screen—the graph will dynamically bounce and reorganize using Neo4j's physics engine!

#### B. 2-Hop Metabolic Bridge Discovery (Core Traversal)
```cypher
MATCH path = (d1:Drug {canonical_name: "warfarin"})-[r:INTERACTS_WITH*2]-(d2:Drug {canonical_name: "simvastatin"})
RETURN path;
```
* **🎯 WHAT WILL APPEAR ON SCREEN:** A clean, focused 3-node path showing:
  `Warfarin` $\longleftrightarrow$ `Amiodarone (Bridge)` $\longleftrightarrow$ `Simvastatin`
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“This is our core discovery: Warfarin and Simvastatin have no documented direct pairwise interaction in traditional tables, but Neo4j’s 2-hop traversal instantly identifies Amiodarone as the shared metabolic clearance bridge!”*

#### C. NoSQL CREATE (C)
```cypher
MERGE (new_drug:Drug {drug_id: 999, canonical_name: "test_compound_x", drug_type: "Small molecule"})
RETURN new_drug;
```
* **🎯 OUTPUT:** Creates and returns a new node in the graph.

#### D. NoSQL READ (R): Node Lookup, Star Network & Centrality

**1. Exact Property Lookup (Fetch Amiodarone Node):**
```cypher
MATCH (d:Drug {canonical_name: 'amiodarone'})
RETURN d;
```
* **🎯 OUTPUT:** Returns the Amiodarone node and its properties in JSON/Table/Graph view.

**2. Local Star Neighborhood / Ego-Network:**
```cypher
MATCH (d:Drug {canonical_name: 'amiodarone'})-[r]-(other)
RETURN d, r, other;
```
* **🎯 OUTPUT:** Renders `Amiodarone` in the center with 3 spokes connecting to `Warfarin`, `Simvastatin`, and `Metoprolol`.

**3. Degree Centrality Aggregation:**
```cypher
MATCH (d:Drug)-[r:INTERACTS_WITH]-()
RETURN d.canonical_name AS drug, count(r) AS degree_centrality
ORDER BY degree_centrality DESC
LIMIT 5;
```
* **🎯 OUTPUT:** Returns drugs ranked by the number of interaction connections.

#### E. NoSQL UPDATE (U)
```cypher
MATCH (d:Drug {drug_id: 999})
SET d.therapeutic_class = "Experimental Anticoagulant"
RETURN d.canonical_name, d.therapeutic_class;
```
* **🎯 OUTPUT:** Updates and returns the modified property on the node.

#### F. NoSQL DELETE (D)
```cypher
MATCH (d:Drug {drug_id: 999})
DETACH DELETE d;
```
* **🎯 OUTPUT:** Deletes the test node from the database.

---

# 10. Next.js interface (3 Marks)

* **📍 WHERE TO SHOW:** Browser at **`http://localhost:3000`**  
* **📋 ACTIONS TO SHOW:**
  1. Login as `dr_sharma`.
  2. Show the **Dashboard**: Highlight summary stat cards (Active Patients, Monitored Regimens, Polypharmacy Count).
  3. Show the **Patient Registry**: Filter or search for `Robert Vance` (`SYN-PAT-1001`).
  4. Click **"View & Screen Regimen"**: Show active prescription cards displaying dosage, frequency, status, and therapeutic class.
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“Our Next.js 14 App Router frontend is built with pure Vanilla CSS tokens, server-side data fetching, and role-aware navigation.”*

---

# 11. Backend/API and database integration (2 Marks)

* **📍 WHERE TO SHOW:** Browser at **`http://localhost:3000/patients/1`**  
* **📋 ACTION TO SHOW:**
  1. On Patient 1, select **Radius: 2 Hops**.
  2. Click **"Run Graph Risk Discovery"**.
  3. Show the two result cards rendered on screen:
     * **Direct Findings:** Warfarin $\leftrightarrow$ Amiodarone and Amiodarone $\leftrightarrow$ Simvastatin (queried from PostgreSQL).
     * **Multi-Hop Candidate Bridge:** Warfarin $\to$ Amiodarone $\to$ Simvastatin (queried from Neo4j).
  4. Navigate to **`/alerts`**: Show that the session was transactionally persisted in PostgreSQL with audit timestamps.
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“Our Next.js API orchestrator queries PostgreSQL for active medications, fetches direct pairs from PostgreSQL, runs Cypher traversals in Neo4j for multi-hop paths, and persists the assessment session into PostgreSQL.”*

---

# 12. Authentication implementation (front end, minimum two roles, and role-based access control in database) (4 Marks)

* **📍 WHERE TO SHOW:** Split between Browser and pgAdmin 4:

#### A. Frontend Authentication & Session Cookie
* Show login screen at `http://localhost:3000/login`. Open Developer Tools (`F12` $\to$ **Application** $\to$ **Cookies**).
* Show the **`session`** cookie: Marked as **`HttpOnly`**, **`SameSite=Lax`**, containing an HS256-signed JWT token.

#### B. Two Application Roles (DOCTOR vs. ADMIN)
* Show `dr_sharma` logged in with badge: `Role: DOCTOR`.
* Show `admin` logged in with badge: `Role: ADMIN`.

#### C. Server-Side Route Guard (Next.js Middleware)
* While logged in as `dr_sharma`, attempt typing `http://localhost:3000/admin` into the URL bar.
* **Result:** Middleware immediately blocks the request and redirects to `/dashboard` with an authorization notice.

#### D. Database-Engine Level RBAC in pgAdmin 4
* Run this command in pgAdmin 4 Query Tool:
```sql
-- Demonstrate database engine rejecting clinician access to user credentials:
SET ROLE role_doctor;
SELECT * FROM user_accounts; -- Throws ERROR: 42501 permission denied for table user_accounts
RESET ROLE;
```
* **🎯 OUTPUT:**
  ```text
  ERROR: permission denied for table user_accounts
  SQL state: 42501
  ```
* **🗣️ WHAT TO SAY TO EXAMINER:**  
  *“We implement defense-in-depth: Next.js middleware guards frontend routes, JWT verifies API requests, and PostgreSQL database engine roles (`role_doctor` vs `role_admin`) prevent clinicians from querying user credentials even if SQL injection occurred.”*

---

# 13. Documentation, Git/GitHub (2 Marks)

* **📍 WHERE TO RUN:** Terminal  
* **📋 COMMAND TO RUN:**
```bash
# Show clean commit history
git log -n 5 --oneline
```
* **📋 FILES TO SHOW IN VS CODE:**
  * Central documentation index: [`docs/README.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/README.md)
  * Data dictionary: [`docs/database-design/DATA_DICTIONARY.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/DATA_DICTIONARY.md)
  * Dataset provenance & SHA-256 manifest: [`data/manifests/source_manifest.csv`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/manifests/source_manifest.csv)

---

# 14. Originality, individual contribution, Modification/Viva (4 Marks)

* **📍 WHERE TO RUN:** Terminal  
* **📋 COMMAND TO RUN (Automated Test Verification Suites):**
```bash
# 1. Run cross-database integration tests (30 assertions)
npm run test:integration

# 2. Run authentication & RBAC security tests (26 assertions)
npm run test:auth

# 3. Run preprocessing & data invariant unit tests (11 tests)
python3 -m unittest discover tests/unit/
```
* **🎯 OUTPUT:** All **67 automated test assertions pass** with zero errors (`30/30`, `26/26`, `11/11`).
* **🗣️ WHAT TO SAY TO EXAMINER (Closing Summary of Originality):**  
  *“Our project tackles a documented clinical blind spot: pairwise EHR checks miss indirect multi-hop metabolic bottlenecks in polypharmacy patients. We designed a dual-database prototype with 10 tables in BCNF/4NF, 11 foreign keys, stored procedures, triggers, recursive CTEs, and Neo4j graph traversals, all verified across 67 automated test assertions.”*
