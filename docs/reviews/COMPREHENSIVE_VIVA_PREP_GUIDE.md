# Comprehensive Viva Preparation & Technical Defense Guide
## Master Reference for PES University DBMS Level 3 Evaluation (50 Marks)

> **Companion Document:** Use alongside [`docs/reviews/FINAL_VIVA_DEMO_GUIDE.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/FINAL_VIVA_DEMO_GUIDE.md).  
> **Strategy:** Keep the Demo Guide open during the live exam to execute commands; study this Preparation Guide beforehand to defend every architectural choice, SQL clause, graph algorithm, and schema decision.

---

# PART I: Problem Statement & Clinical Motivation

### 1. The Real-World Clinical Problem: Polypharmacy Blind Spots
* In modern healthcare, elderly and multi-morbid patients routinely take **5 to 10+ concurrent prescription medications** (a condition known as **polypharmacy**).
* Conventional Electronic Health Record (EHR) systems evaluate drug safety using simple **pairwise lookups** ($O(N^2)$ direct checks between Drug A and Drug B).
* **The Blind Spot:** Standard pairwise lookups assume an adverse drug event only occurs if two drugs have a direct, documented, pairwise interaction. In reality, many catastrophic clinical complications manifest through **indirect, mechanism-based multi-hop pathways** spanning intermediary metabolic enzymes or biological targets.

### 2. Concrete Pharmacological Example (Your Live Demo Story)
Tell this exact story to the examiner:
1. **Patient 1 (`Robert Vance`)** is prescribed three active medications:
   * **Warfarin** (an oral anticoagulant preventing blood clots, metabolized by hepatic enzyme `CYP2C9`).
   * **Simvastatin** (a cholesterol-lowering statin, metabolized by hepatic enzyme `CYP3A4`).
   * **Amiodarone** (an antiarrhythmic drug for cardiac rhythm control).
2. **The Pairwise Limitation:** A clinician checking the pair `(Warfarin, Simvastatin)` alone will not see a severe direct interaction alert in most basic EHR lookup tables.
3. **The Multi-Hop Reality:** Both Warfarin and Simvastatin interact strongly with **Amiodarone**. Amiodarone is a potent inhibitor of both `CYP2C9` and `CYP3A4`.
4. **The Cascade:** When all three are taken together, Amiodarone shuts down the metabolic clearance pathways of *both* Warfarin and Simvastatin simultaneously. Warfarin plasma concentrations surge (causing life-threatening internal hemorrhaging), while Simvastatin concentrations spike (causing rhabdomyolysis and acute renal failure).
5. **The Solution:** Our dual-database prototype discovers this **2-hop metabolic bridge** (`Warfarin -> Amiodarone -> Simvastatin`) using bounded graph traversal, surfacing risks invisible to traditional relational tables.

---

# PART II: Core DBMS & SQL Theoretical Foundations

Before defending the rubrics, master these essential DBMS concepts that examiners love to test:

### 1. Relational Integrity Constraints
* **Entity Integrity:** Every base table must have a Primary Key (`PK`), and no PK attribute can be `NULL` (guaranteed by `SERIAL / BIGSERIAL PRIMARY KEY`).
* **Referential Integrity:** Foreign keys (`FK`) must reference an existing valid PK in the parent table or be `NULL`. Enforced with referential actions (`ON DELETE CASCADE` for dependent findings, `ON DELETE RESTRICT` for reference drugs).
* **Domain / Semantic Constraints:** Enforced using PostgreSQL `CHECK` constraints (e.g., `CHECK (is_synthetic = TRUE)`, `CHECK (hop_count BETWEEN 1 AND 3)`, `CHECK (drug_a_id < drug_b_id)`).

### 2. Normalization Theory (Why BCNF and 4NF?)
* **First Normal Form (1NF):** Every attribute contains only atomic (indivisible) scalar values; no repeating groups or comma-separated lists.
* **Second Normal Form (2NF):** Table is in 1NF and contains no *partial functional dependencies* (no non-prime attribute depends on a proper subset of a composite candidate key).
* **Third Normal Form (3NF):** Table is in 2NF and contains no *transitive functional dependencies* (non-prime attributes depend only on candidate keys, not on other non-prime attributes).
* **Boyce-Codd Normal Form (BCNF):** For every non-trivial functional dependency $X \to Y$, the determinant $X$ must be a **superkey**. Our core catalog tables (`drugs`, `drug_source_mappings`, `ddi_pairs`, `patients`, `prescriptions`) are in BCNF.
* **Fourth Normal Form (4NF):** Eliminates **Multi-Valued Dependencies ($X \twoheadrightarrow Y$)**.
  * *Why 4NF is critical in our project:* An interaction pair can have multiple independent clinical severity levels (from DDInter) and up to 3 independent mechanism categories (from MecDDI). Combining them into a single table would create multi-valued redundancy. Decomposing them into `ddi_severities` and `ddi_mechanisms` achieves 4NF.

### 3. Canonical Unordered Pair Representation
* Drug interactions are symmetric: Drug A interacting with Drug B is identical to Drug B interacting with Drug A.
* If stored naively, you would store both `(1, 4)` and `(4, 1)`, doubling storage and creating update anomalies.
* **Our Mathematical Invariant:** We enforce a check constraint:
  $$\text{CHECK} \ (drug\_a\_id < drug\_b\_id)$$
* This mathematically guarantees an unordered pair has a single canonical representation, eliminates duplicate reverse edges, and prevents self-interactions ($drug\_a = drug\_b$).

### 4. Relational Joins vs. Graph Index-Free Adjacency
* **Relational Joins ($O(b^k)$):** Relational databases store records in separate tables. Finding multi-hop connections ($A \to B \to C$) requires joining the table to itself repeatedly via foreign keys. As depth increases, execution time degrades exponentially due to intermediate Cartesian explosions and index lookups.
* **Index-Free Adjacency ($O(d^k)$):** In Neo4j, every node maintains direct, double-linked physical memory pointers to its adjacent relationship records. Traversing a relationship does not require searching an index — it simply dereferences a memory pointer in $O(1)$ constant time per hop.

---

# PART III: Rubric-by-Rubric Defense & Live Demo Mapping

The following 14 sections strictly match the 14 rows of **Table 2 in the official DBMS evaluation rubric**:

---

## Rubric 1: ER diagram [2 Marks]

* **Demonstration Action:** Open [`docs/database-design/ER_Diagram_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf).
* **Technical Concept:** Conceptual Data Modeling using formal Peter Chen notation.
* **Key Architecture Elements to Explain:**
  1. **Rectangles (Entity Sets):** 10 base entities.
  2. **Diamonds (Relationship Sets):** 12 relationships.
  3. **Ellipses (Attributes):** Primary keys underlined (`drug_id`, `patient_id`, `mrn`, etc.).
  4. **Structural Constraints `(min, max)`:**
     * Child entities have **total participation** `(1,1)`: every `PRESCRIPTION` must belong to exactly 1 `PATIENT` and 1 `DRUG`.
     * Parent entities have **partial participation** `(0,N)`: a `DRUG` may have 0 or many prescriptions.
  5. **`<UNDERGOES>` Relationship:** Connects `PATIENT` to `RISK_ASSESSMENT`. A patient undergoes an assessment across all their medications; individual prescriptions do not undergo assessments.
  6. **Dashed Line `<PERFORMED_BY>`:** Connects `USER_ACCOUNT` to `RISK_ASSESSMENT`. Rendered dashed with an explicit note: *conceptual link, no SQL FK*.
* **Examiner Q&A:**
  * **Q:** *"Why is `PERFORMED_BY` dashed without a physical foreign key in SQL?"*
  * **A:** *"Clinical screening sessions are legal audit records. If an administrative user account is deactivated or deleted, historical patient risk assessments must never be deleted (`CASCADE`) or blocked from deletion (`RESTRICT`). We store the clinician username as an immutable audit text string."*

---

## Rubric 2: Relational schema with keys, relationships, and constraints [3 Marks]

* **Demonstration Action:** Open [`docs/database-design/Relational_Schema_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf).
* **Technical Concept:** Logical Schema Mapping, Normalization (BCNF & 4NF), and Foreign Key Referencing.
* **Key Architecture Elements to Explain:**
  1. **All 10 Tables Mapped:** `drugs`, `drug_source_mappings`, `ddi_pairs`, `ddi_severities`, `ddi_mechanisms`, `patients`, `prescriptions`, `risk_assessments`, `assessment_findings`, and `user_accounts`.
  2. **Exactly 11 Foreign-Key Connectors:** Every arrow points from child attribute to parent primary key.
  3. **Multi-Hop Finding Endpoints:** `assessment_findings` connects to `drugs` via `drug_a_id` and `drug_b_id`. It does *not* link to `ddi_pairs` because multi-hop pathways (2-hop, 3-hop) span intermediary bridges and do not have a single direct pair ID.
  4. **Snapshot Design:** `severity_level` and `mechanism_category` on `assessment_findings` are documented as historical point-in-time snapshots to maintain audit integrity.
* **Examiner Q&A:**
  * **Q:** *"Why separate `ddi_severities` and `ddi_mechanisms` from `ddi_pairs`?"*
  * **A:** *"To satisfy Fourth Normal Form (4NF). A pair can have multiple severities across external datasets and multiple mechanism labels from pharmacological sources. Keeping them separate prevents multi-valued dependency anomalies ($pair\_id \twoheadrightarrow mechanism$)."*

---

## Rubric 3: SQL database implementation - DDL with constraints [4 Marks]

* **Demonstration Action:** In pgAdmin 4 Query Tool, execute:
  ```sql
  SELECT table_name, 
         (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) AS column_count
  FROM information_schema.tables t
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
  ```
  Then run the check constraint violation test:
  ```sql
  INSERT INTO patients (mrn, full_name, gender, date_of_birth, primary_condition, is_synthetic)
  VALUES ('REAL-999', 'Real Patient', 'Male', '1980-01-01', 'Hypertension', FALSE);
  ```
* **Technical Concept:** Data Definition Language (DDL), System Catalogs (`information_schema`), and Constraint Enforcement.
* **What You Are Showing:**
  1. The first query queries PostgreSQL's system catalog to prove all 10 physical tables are created with proper schemas.
  2. The second query proves that PostgreSQL engine-level check constraints (`CHECK (is_synthetic = TRUE)`) actively abort illegal transactions.
* **Examiner Q&A:**
  * **Q:** *"What happens if a clinician enters an invalid hop depth in an assessment?"*
  * **A:** *"The table `risk_assessments` enforces `CHECK (max_hop_depth BETWEEN 1 AND 3)`. The PostgreSQL engine will reject any value outside that range with a check constraint violation."*

---

## Rubric 4: NoSQL/Vector database creation [4 Marks]

* **Demonstration Action:** In Neo4j Browser (`http://localhost:7474`), execute:
  ```cypher
  SHOW CONSTRAINTS;
  ```
  Then count nodes:
  ```cypher
  MATCH (d:Drug) RETURN count(d) AS total_drug_nodes;
  ```
* **Technical Concept:** Property Graph Schema, Label Indexing, and Node Uniqueness Constraints.
* **What You Are Showing:**
  1. Neo4j enforces uniqueness constraints on `:Drug(drug_id)`, preventing duplicate node creation.
  2. Nodes are categorized with labels and indexed for sub-millisecond entry-point lookups.
* **Examiner Q&A:**
  * **Q:** *"Why is a uniqueness constraint needed in Neo4j if graph databases are schema-optional?"*
  * **A:** *"Without a uniqueness constraint on `drug_id`, running Cypher `MERGE` statements during parallel data ingestion could create duplicate nodes for the same drug, fracturing the graph topology."*

---

## Rubric 5: Technology justification [1 Mark]

* **Demonstration Action:** Verbal presentation referencing [`docs/database-design/TECHNOLOGY_JUSTIFICATION.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/TECHNOLOGY_JUSTIFICATION.md).
* **Technical Concept:** Polyglot Persistence Architecture Trade-Offs.
* **What to Say:**
  * *"We chose a dual-database polyglot architecture because no single database engine is optimal for both ACID transactional health records and multi-hop network traversals."*
  * *"**PostgreSQL** provides strict ACID compliance, serializable transactions, relational integrity, and granular RBAC for patient medical records and audit histories."*
  * *"**Neo4j** provides index-free adjacency for graph traversal. Searching 2-hop or 3-hop paths in relational SQL requires joining the 220,000-row interaction table to itself multiple times ($O(N^2)$), causing join explosion. Neo4j dereferences direct memory pointers in $O(1)$ time per hop."*
  * *"**Why not a Vector Database?** Vector databases perform Approximate Nearest Neighbor (ANN) search over high-dimensional embeddings for semantic similarity (e.g., text search). They cannot trace deterministic, multi-hop causal pathways ($A \to B \to C$) or enforce exact biomedical rules."*

---

## Rubric 6: DML operations [4 Marks]

* **Demonstration Action:** In pgAdmin 4 Query Tool, execute the 4 standard DML queries:
  1. **INSERT:** Prescribe medication (drug_id=8) to patient 2 using `RETURNING`.
  2. **SELECT:** Join `prescriptions`, `patients`, and `drugs` to display active regimens.
  3. **UPDATE:** Update prescription dosage from `10mg` to `20mg`.
  4. **DELETE:** Execute a controlled soft-delete updating `status = 'DISCONTINUED'` and `end_date = CURRENT_DATE`.
* **Technical Concept:** Data Manipulation Language, Atomic State Transitions, and Audit Preservation.
* **What You Are Showing:** Full lifecycle of prescription data. Point out the use of `RETURNING` clauses, which return modified tuple values immediately without requiring a second round-trip `SELECT` query.
* **Examiner Q&A:**
  * **Q:** *"Why use soft delete (`status = 'DISCONTINUED'`) instead of physical SQL `DELETE FROM prescriptions`?"*
  * **A:** *"In clinical health systems, prescription history is legal medical record data. Physical deletion destroys auditability. Soft deletion preserves the start date, end date, and discontinuation timestamp for historical review."*

---

## Rubric 7: Nested/correlated/Recursive Queries, Join SQL queries [4 Marks]

* **Demonstration Action:** In pgAdmin 4 Query Tool, run the 5 queries from Section 7 of the Demo Guide:
  1. **Multi-Table Outer Join:** Combines `ddi_pairs`, `drugs`, `ddi_severities`, and `ddi_mechanisms` with `LEFT JOIN` and `string_agg()`.
  2. **Self-Join:** Joins `prescriptions` to itself with condition `pr1.drug_id < pr2.drug_id` to generate all unordered pairs for Patient 1.
  3. **Correlated Subquery with `EXISTS`:** Searches for drugs where an inner query evaluates whether a Major severity pair exists for that specific outer drug ID.
  4. **Nested Subquery with `IN`:** Selects patients whose prescribed drugs match an inner set of drugs associated with hepatic metabolism.
  5. **Recursive CTE (Pure SQL Graph Traversal):** Uses `WITH RECURSIVE GraphPaths AS (...)` to traverse 2-hop paths in PostgreSQL.
* **Technical Concept:** Relational Algebra, Correlated Execution Plans, and Fixed-Point Recursive Evaluation.
* **What to Say for Recursive CTE:**
  * *"Our Recursive CTE has two parts: an **Anchor Member** that finds direct 1-hop edges from Warfarin (drug_id=1), and a **Recursive Member** that joins `ddi_pairs` to extend paths to depth 2 while preventing circular cycles with `NOT (next_drug = ANY(path_nodes))`."*
  * *"This proves to the examiner that we understand how graph traversal is executed relationally, demonstrating why Neo4j is superior for deeper traversals."*

---

## Rubric 8: Advanced SQL concepts (Procedure/function, trigger, CTE) [6 Marks]

* **Demonstration Action:** In pgAdmin 4 Query Tool, execute:
  1. **Stored Function:** `SELECT * FROM fn_perform_patient_direct_screening(1, 'dr_sharma'::varchar);`
  2. **Live Trigger Proof:** Insert an assessment header (starts with counters at 0), insert one finding row, and query the header again to show `direct_interaction_count` incremented to `1`.
  3. **Window Function with `PARTITION BY`:** Run query with `ROW_NUMBER() OVER (PARTITION BY pr.patient_id ORDER BY pr.start_date)` and `COUNT(*) OVER (PARTITION BY pr.patient_id)` across active patient prescriptions.
* **Technical Concept:** Procedural SQL (`PL/pgSQL`), Database Event Triggers, Execution Security, and Non-Collapsing Window Partitions.
* **Key Architecture Elements to Explain:**
  * **Stored Procedure Benefits:** Reduces network latency by executing multiple queries inside the database engine in a single round-trip, running inside a single transaction.
  * **Trigger Execution & Security:** Trigger `trg_assessment_findings_count` executes `AFTER INSERT ON assessment_findings`. It is defined with `SECURITY DEFINER SET search_path = public, pg_temp` to prevent search-path hijacking attacks.
  * **Window Function (`PARTITION BY`):** Unlike `GROUP BY` which collapses rows into summary groups, window functions use `PARTITION BY patient_id` to compute sequential regimen sequence numbers and cohort counts while preserving every individual prescription row.

---

## Rubric 9: NoSQL/Vector feature, RUD [7 Marks]

* **Demonstration Action:** In Neo4j Browser (`http://localhost:7474`), run the Cypher queries from Section 9 of the Demo Guide:
  1. **Visual Graph:** `MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug) RETURN d1, r, d2 LIMIT 30;`
  2. **2-Hop Bridge:** `MATCH path = (d1:Drug {canonical_name: "warfarin"})-[r:INTERACTS_WITH*2]-(d2:Drug {canonical_name: "simvastatin"}) RETURN path;`
  3. **NoSQL CREATE:** `MERGE (new_drug:Drug {drug_id: 999, ...}) RETURN new_drug;`
  4. **NoSQL READ (Node Lookup & Star Network):**
     * Single node lookup: `MATCH (d:Drug {canonical_name: 'amiodarone'}) RETURN d;`
     * Star ego-network: `MATCH (d:Drug {canonical_name: 'amiodarone'})-[r]-(other) RETURN d, r, other;`
     * Degree centrality: `MATCH (d:Drug)-[r:INTERACTS_WITH]-() RETURN d.canonical_name, count(r) AS degree_centrality ORDER BY degree_centrality DESC LIMIT 5;`
  5. **NoSQL UPDATE:** `MATCH (d:Drug {drug_id: 999}) SET d.therapeutic_class = "Experimental" RETURN d;`
  6. **NoSQL DELETE:** `MATCH (d:Drug {drug_id: 999}) DETACH DELETE d;`
* **Technical Concept:** Declarative Graph Query Language (Cypher), Pattern Matching, and Graph Centrality.
* **What You Are Showing:**
  * Complete NoSQL CRUD functionality explicitly required by the rubric for 7 marks.
  * Degree centrality calculation (identifying high-risk hub drugs with the most documented interactions).
  * Direct visualization of the Warfarin $\leftrightarrow$ Amiodarone $\leftrightarrow$ Simvastatin bridge.

---

## Rubric 10: Next.js interface [3 Marks]

* **Demonstration Action:** In browser at **`http://localhost:3000`**:
  1. Show the **Dashboard**: Point out real-time cohort statistics (Active Patients, Total Regimens, Polypharmacy Count).
  2. Show the **Patient Registry**: Filter or search for `Robert Vance` (`SYN-PAT-1001`).
  3. Show the **Regimen View**: Display prescription cards with dosage, frequency, and therapeutic class.
* **Technical Concept:** Modern Web Application Architecture, Server-Side Rendering (SSR), Component Hierarchy, and CSS Tokenization.
* **What to Say:**
  * *"Our web application is built with the Next.js 14 App Router using TypeScript and a bespoke Vanilla CSS design system. All interactive elements have descriptive IDs, and data is fetched server-side to prevent exposing database credentials to the browser."*

---

## Rubric 11: Backend/API and database integration [2 Marks]

* **Demonstration Action:** In browser on Patient 1 (`/patients/1`):
  1. Set **Radius: 2 Hops** and click **"Run Graph Risk Discovery"**.
  2. Show the parallel results:
     * Direct findings from PostgreSQL.
     * 2-hop candidate pathways from Neo4j.
  3. Navigate to **`/alerts`** to show the saved clinical audit record.
* **Technical Concept:** Cross-Database Orchestration, Service Layer Architecture, and Dual-Persistence Transaction Coordination.
* **What to Say:**
  * *"Our Next.js route handler (`/api/patients/[id]/analyze-risk`) acts as a unified orchestrator: it queries PostgreSQL for active patient prescriptions, queries PostgreSQL for direct pairs, queries Neo4j for multi-hop graph bridges, and persists the findings back into PostgreSQL within an ACID transaction."*

---

## Rubric 12: Authentication implementation (front end, minimum two roles, and role-based access control in database) [4 Marks]

* **Demonstration Action:** 
  1. **Frontend / JWT:** Show `session` cookie in browser DevTools (HttpOnly, SameSite=Lax, HS256 JWT).
  2. **Two Roles:** Show `dr_sharma` (DOCTOR) vs. `admin` (ADMIN).
  3. **Middleware Guard:** Attempt typing `http://localhost:3000/admin` as Doctor $\to$ redirected to `/dashboard`.
  4. **Database-Level RBAC:** In pgAdmin 4 Query Tool, run:
     ```sql
     SET ROLE role_doctor;
     SELECT * FROM user_accounts; -- Throws ERROR 42501 permission denied
     RESET ROLE;
     ```
* **Technical Concept:** Defense-in-Depth Security, Cryptographic Session Management, Least-Privilege Architecture, and Engine-Level SQL Privilege Grants.
* **What to Say:**
  * *"We enforce security at three distinct layers: Next.js Edge Middleware protects URL routes, cryptographically signed JWT cookies authenticate API endpoints, and dedicated PostgreSQL roles (`role_doctor` vs `role_admin`) enforce table-level permissions directly in the database engine."*

---

## Rubric 13: Documentation, Git/GitHub [2 Marks]

* **Demonstration Action:** 
  1. In terminal, run: `git log -n 5 --oneline`
  2. In VS Code, show:
     * Central Index: [`docs/README.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/README.md)
     * Data Dictionary: [`docs/database-design/DATA_DICTIONARY.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/DATA_DICTIONARY.md)
     * Source Manifest: [`data/manifests/source_manifest.csv`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/manifests/source_manifest.csv) (tracking SHA-256 hashes and row counts across all 17 biomedical source files).
* **Technical Concept:** Software Engineering Rigor, Data Provenance, and Version Control Hygiene.

---

## Rubric 14: Originality, individual contribution, Modification/Viva [4 Marks]

* **Demonstration Action:** In terminal, execute the 3 automated test suites:
  ```bash
  npm run test:integration              # 30/30 assertions pass
  npm run test:auth                     # 26/26 assertions pass
  python3 -m unittest discover tests/unit/  # 11/11 tests pass
  ```
  *(Total: 67 automated assertions pass)*
* **Technical Concept:** Automated Regression Verification, Test-Driven Invariant Enforcement, and Research Originality.
* **Closing Presentation Summary:**
  * *"Traditional EHR drug screening is blind to multi-hop enzyme competition. Our prototype proves that polyglot persistence (PostgreSQL + Neo4j) can uncover indirect polypharmacy risks in sub-50ms without the exponential join penalties of relational self-joins."*
  * *"Every architectural choice — from BCNF/4NF decomposition and canonical ordering checks to stored procedures, atomic triggers, and database-level RBAC — was built to strictly satisfy the Level 3 criteria."*
