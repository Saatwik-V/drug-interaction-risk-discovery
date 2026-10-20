# Comprehensive Viva Demonstration & Defense Guide

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course:** PES University — Department of Computer Science & Engineering — DBMS Experiential Learning Level 3 (Aug–Dec 2026)  
**System Architecture:** PostgreSQL 16 + Neo4j 5 + Next.js 14 App Router (Full-Stack TypeScript)  

---

## 1. Project Overview & Problem Statement

### The Polypharmacy Challenge
In clinical medicine, elderly or multi-morbid patients frequently take 5 to 10+ concurrent medications (polypharmacy). Conventional Electronic Health Record (EHR) systems evaluate drug safety using simple **pairwise lookups** ($O(N^2)$ checks for known direct interactions between Drug A and Drug B).

### The Architectural Limitation of Relational-Only Lookups
However, many adverse drug events stem from **indirect, mechanism-based multi-hop interactions**:
- **Drug A** (e.g., Warfarin, an anticoagulant) interacts with **Drug C** (Amiodarone, an antiarrhythmic) via CYP2C9 inhibition.
- **Drug B** (Simvastatin, a statin) also interacts with **Drug C** (Amiodarone) via CYP3A4 inhibition.
- While the pair `(Warfarin, Simvastatin)` may not be flagged as a high-severity direct interaction in a standard pairwise table, their shared interaction partner (Amiodarone) creates a **2-hop metabolic bottleneck**, dramatically escalating hemorrhage and rhabdomyolysis risks.

### The Solution
Our system builds a **polyglot persistence architecture**:
1. **PostgreSQL** enforces relational integrity, ACID transactional history, synthetic patient regimens, audit trails, and strict role-based access control.
2. **Neo4j** traverses the documented biomedical drug interaction graph up to 3 hops, surfacing candidate shared-partner pathways that explain hidden polypharmacy risks.

> [!IMPORTANT]
> **Scientific & Academic Disclaimer:**  
> Multi-hop traversals return *candidate mechanistic hypotheses*, not proven clinical co-toxicities. This system is a database-systems research prototype, not a clinical diagnostic or prescribing advice device.

---

## 2. Live Demonstration Sequence (Step-by-Step)

Follow this 5-minute presentation script during the live viva:

### Step 1: System Health & Docker Runtime Verification
Open terminal and show running containers:
```bash
docker compose ps
```
**Talking Point:**  
*"Our system operates on isolated, reproducible containerized databases: PostgreSQL 16-alpine on port 5432 and Neo4j 5-community on bolt port 7687 and HTTP port 7474."*

---

### Step 2: Clinician Login & Authentication
1. Open browser at `http://localhost:3000`.
2. Notice the login screen with quick-fill demo credentials.
3. Click **"Doctor Demo (dr_sharma)"** and click **Sign In**.
4. Show the dashboard greeting: *"Welcome, Dr. Sharma | DOCTOR Role"*.

**Talking Point:**  
*"Passwords are authenticated using bcrypt with 10 salt rounds. Sessions are cryptographically signed using HS256 JWT tokens and stored in secure, HttpOnly, SameSite=Lax cookies to prevent XSS credential theft."*

---

### Step 3: Doctor Dashboard & Cohort Inspection
1. Inspect the 4 synthetic patients (`SYN-PAT-1001` through `SYN-PAT-1004`).
2. Show the cohort summary metrics (Active Patients, Total Monitored Regimens, Polypharmacy Patients).
3. Search or filter for patient `Robert Vance` (`SYN-PAT-1001`).

**Talking Point:**  
*"All patients in this database are synthetic. Table-level check constraints (`CHECK (is_synthetic = TRUE)`) mathematically guarantee that real patient records cannot be inserted into the system."*

---

### Step 4: Patient Regimen & Cross-Database Risk Screening
1. Click **"View & Screen Regimen"** on Patient 1 (`SYN-PAT-1001`).
2. Observe active prescriptions:
   - **Warfarin** (5mg, Once daily)
   - **Amiodarone** (200mg, Twice daily)
   - **Simvastatin** (20mg, Once daily at bedtime)
3. Set Traversal Search Radius to **2 Hops** and click **"Run Graph Risk Discovery"**.
4. Review the results:
   - **Direct Pairwise Findings (2 found via PostgreSQL):**
     1. `Warfarin <-> Amiodarone` (Major severity, DDInter+MecDDI)
     2. `Amiodarone <-> Simvastatin` (Major severity, DDInter+MecDDI)
   - **Multi-Hop Candidate Pathway (1 discovered via Neo4j):**
     - `Warfarin -> Amiodarone -> Simvastatin` (2 hops)
     - Shows Amiodarone acting as the intermediary metabolic bridge.
   - **Trigger Update:**
     - The trigger `trg_assessment_findings_count` automatically updated the session header counters (`direct_interaction_count = 2`, `multi_hop_candidate_count = 1`).

**Talking Point:**  
*"The Next.js backend orchestrator queried PostgreSQL for active medications, queried PostgreSQL for direct pairs, traversed Neo4j for 2-hop candidate bridges, and transactionally persisted the assessment session and findings into PostgreSQL."*

---

### Step 5: Historical Alerts & Audit Retrieval
1. Click **"Alerts Audit"** in the navigation bar (`/alerts`).
2. Show the persistent audit log of all screening sessions.
3. Expand the newly created assessment to inspect findings, traversal paths, and timestamps.

**Talking Point:**  
*"Every screening session is immutably logged for clinical governance. Finding severities and mechanism categories are captured as point-in-time snapshots to ensure historical audit integrity even if external biomedical datasets are updated."*

---

### Step 6: Database-Level RBAC Enforcement (Security Demonstration)
1. Attempt to navigate directly to `/admin` or `/admin/users` as `dr_sharma`.
2. Notice the application middleware intercepts the request and redirects to `/dashboard` with an authorization notice.
3. Show that at the PostgreSQL database engine level, `app_doctor_user` has `REVOKE ALL ON TABLE user_accounts`.

**Talking Point:**  
*"Our security is enforced in depth: Next.js edge middleware guards URL routes, API handlers verify JWT claims, and dedicated PostgreSQL connection pools ensure clinicians query under `role_doctor`, preventing SQL injection attacks from accessing user credentials."*

---

### Step 7: Admin Console & User Provisioning
1. Click **"Sign Out"**.
2. Click **"Admin Demo (admin)"** and click **Sign In**.
3. Access `/admin` and `/admin/users`.
4. Inspect active system accounts and demonstrate user account creation.

---

## 3. Database Design & Advanced SQL Defense

### 3.1 Normalization Defense (BCNF & 4NF)
- **BCNF Compliance:** In every relation (`drugs`, `drug_source_mappings`, `ddi_pairs`, `ddi_severities`, `patients`, `prescriptions`, `risk_assessments`, `assessment_findings`, `user_accounts`), every non-trivial functional dependency $X \to Y$ has a determinant $X$ that is a candidate key.
- **4NF Separation:** In the biomedical source data:
  - DDInter provides clinical severity ratings (`Major`, `Moderate`, `Minor`).
  - MecDDI provides 1 to 3 independent mechanism categories (`Affected cellular transport`, `Pharmacodynamic additive effects`, etc.).
  - Combining them into a single table would create a multi-valued dependency ($pair\_id \twoheadrightarrow mechanism\_category$), causing severe redundancy.
  - Decomposing them into `ddi_severities` and `ddi_mechanisms` achieves **Fourth Normal Form (4NF)**.
- **Canonical Ordering Constraint:**  
  $$\text{CHECK} \ (drug\_a\_id < drug\_b\_id)$$
  This guarantees that an unordered interaction pair $(A, B)$ has a single unique representation, eliminating symmetric duplicate records $(B, A)$ and preventing self-interactions $(A = A)$.

### 3.2 Advanced SQL Implementations in PostgreSQL
1. **Stored Function (`fn_perform_patient_direct_screening`):**
   - Encapsulates transactional patient screening logic directly inside PostgreSQL.
2. **Database Trigger (`trg_assessment_findings_count`):**
   - Fires `AFTER INSERT` on `assessment_findings`.
   - Executes `fn_update_assessment_counts()` with `SECURITY DEFINER SET search_path = public, pg_temp` to increment assessment counters atomically.
3. **Recursive Graph CTE:**
   - In `database/postgres/04_required_queries.sql`, a recursive Common Table Expression traverses 2-hop interaction paths in pure SQL, providing an analytical comparison against Neo4j's index-free adjacency.
4. **Window Functions:**
   - Utilizes `DENSE_RANK()` and `COUNT(*) OVER (PARTITION BY ...)` to rank patients by polypharmacy risk density.

---

## 4. Neo4j Graph Model & Traversal Defense

### Why Neo4j is Needed Alongside PostgreSQL
| Feature | Relational (PostgreSQL) | Native Graph (Neo4j) |
|---|---|---|
| **Data Model** | Tables, Rows, Foreign Keys | Nodes, Labels, Directed/Undirected Edges |
| **Relationship Traversal** | Recursive CTE or multi-table self-joins: $O(b^k)$ | Index-free adjacency: $O(d^k)$ pointer dereferences |
| **Path Query Syntax** | 25+ lines of SQL with nested array aggregations | Declarative Cypher: `(d1)-[:INTERACTS_WITH*1..3]-(d2)` |
| **Optimal Use Case** | ACID transactions, demographics, prescriptions, audits | Arbitrary-depth network traversal, bridge explanation |

### Neo4j Cypher Traversal Query
```cypher
MATCH path = (d1:Drug)-[:INTERACTS_WITH*1..3]-(d2:Drug)
WHERE d1.drug_id IN $patientMeds 
  AND d2.drug_id IN $patientMeds 
  AND d1.drug_id < d2.drug_id
RETURN [node in nodes(path) | node.canonical_name] AS path_names,
       length(path) AS hops,
       [rel in relationships(path) | rel.severity_level] AS severities;
```

---

## 5. Technical Q&A: Likely Examiner Questions & Defensible Answers

### Q1: "Why not use a Vector Database since the rubric mentions NoSQL / Vector?"
**Answer:**  
*"The official rubric groups NoSQL and Vector databases under Category 4 ('NoSQL / Vector database creation & CRUD'). In our domain, drug-drug interactions are explicit, curated biomedical relationships, not semantic text similarities. Vector databases perform Approximate Nearest Neighbor (ANN) search over embeddings, which cannot traverse multi-hop causal paths ($A \to B \to C$) or return deterministic explanation chains. Neo4j is a native NoSQL graph database that perfectly fits the network topology problem while fully satisfying the rubric."*

### Q2: "Why didn't you link `prescriptions.prescribed_by` to `user_accounts` with a Foreign Key?"
**Answer:**  
*"In healthcare database design, clinical prescriptions and historical screening sessions must remain permanent, immutable audit records. Tying them via a foreign key to `user_accounts` would create operational coupling: deactivating or deleting a staff account would threaten historical patient records (`ON DELETE CASCADE`) or prevent account maintenance (`ON DELETE RESTRICT`). Storing clinician usernames as audit strings preserves immutability and isolates authentication transactions from patient care transactions."*

### Q3: "What happens if a clinician modifies findings in the database?"
**Answer:**  
*"At the database engine level, `role_doctor` is granted only `SELECT` and `INSERT` on `risk_assessments` and `assessment_findings`. Clinicians do NOT have `UPDATE` or `DELETE` privileges. Even if a clinician compromises the web application layer, the PostgreSQL engine rejects modifications to historical clinical findings."*

### Q4: "How do you avoid SQL injection when generating dynamic graph paths?"
**Answer:**  
*"All database interactions in Next.js use parameterized queries (`$1, $2` in `pg` and `$patientMeds` parameter maps in `neo4j-driver`). User input is validated before query generation, preventing SQL and Cypher injection attacks."*

### Q5: "How does the system ensure real patient records aren't mixed with test data?"
**Answer:**  
*"The `patients` table has an explicit domain check constraint: `CHECK (is_synthetic = TRUE)`. Any attempt to insert a record where `is_synthetic` is false or omitted will fail at the database engine level."*
