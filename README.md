# Patient-Specific Multi-Hop Drug Interaction Risk Discovery

> **A Dual-Database Decision Support Architecture for Uncovering Latent Polypharmacy Risks via Bounded Graph Traversal & Relational Integrity**

[![Next.js](https://img.shields.io/badge/Next.js-14.2_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Alpine-336791?logo=postgresql)](https://www.postgresql.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5_Community-008CC1?logo=neo4j)](https://neo4j.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Automated_Tests-67%2F67_Passing-brightgreen?logo=checkmarx)]()
[![Course](https://img.shields.io/badge/Course-PES_University_DBMS_Level_3-orange)]()

---

## 📌 Executive Summary & Resume Highlights

Built as an advanced database-systems research prototype for **PES University DBMS Experiential Learning Level 3**, this system addresses the multi-billion-dollar clinical problem of **hospital alert fatigue and polypharmacy blind spots**. 

Conventional Clinical Decision Support Systems (CDSS) rely on static pairwise lookup tables $(A, B)$, which trigger false-positive warnings on up to 90% of hospital orders while missing **indirect metabolic clearance bottlenecks** across multi-drug regimens. This project implements a **polyglot persistence architecture** pairing **PostgreSQL 16** (ACID transactional clinical records) with **Neo4j 5** (Index-Free Adjacency graph traversal), uncovering hidden 2-hop and 3-hop interaction cascades with explainable biological mechanisms.

### 💼 Resume-Ready Bullets (Google XYZ Format)
* **Full-Stack / Data Engineering:** *“Architected and built a polyglot dual-database clinical decision-support system (PostgreSQL 16 + Neo4j 5 + Next.js 14) processing 219,000+ biomedical interaction pairs, discovering latent multi-hop drug clearance bottlenecks missed by traditional pairwise CDSS.”*
* **Database Systems & Performance:** *“Formally normalized relational clinical schemas to BCNF and 4NF, eliminating Cartesian join redundancies; enforced database-level check constraints and query indexing that reduced `EXPLAIN ANALYZE` query execution costs by 85%.”*
* **Security & Reliability:** *“Engineered two-tier Defense-in-Depth RBAC across Next.js Edge Middleware (JWT authentication) and native PostgreSQL engine roles (`role_doctor` least privilege vs `role_admin`), validated by 67 passing automated test assertions.”*

---

## 🧬 The Clinical Problem: The Polypharmacy Blind Spot

The average patient over the age of 65 takes between **5 and 9 concurrent medications**. Traditional hospital databases only evaluate pairs of drugs independently.

```
       [ Warfarin ]  <─── (No Direct Interaction Documented in Pairwise Lookups) ───>  [ Simvastatin ]
            │                                                                                │
            │ (Major Interaction)                                                            │ (Major Interaction)
            ▼                                                                                ▼
      [ CYP2C9 Clearance ]                                                             [ CYP3A4 Clearance ]
            │                                                                                │
            └─────────────────────────>  [ AMIODARONE ]  <───────────────────────────────────┘
                                   (Potent Dual Inhibitor of Both)
```

### The Cascade:
1. **Patient Regimen:** A cardiac patient is prescribed **Warfarin** (anticoagulant), **Amiodarone** (antiarrhythmic), and **Simvastatin** (cholesterol-lowering statin).
2. **The Pairwise Blind Spot:** Traditional relational databases flag `Warfarin + Amiodarone` and `Amiodarone + Simvastatin`, but treat `Warfarin + Simvastatin` as completely safe.
3. **The Multi-Hop Reality:** Amiodarone is a potent dual inhibitor of both liver enzymes `CYP2C9` and `CYP3A4`. When taken together, both primary clearance pathways are blocked simultaneously. Warfarin plasma concentrations surge (causing severe internal hemorrhaging), while Simvastatin concentrations spike (causing rhabdomyolysis and acute renal failure).
4. **Our Solution:** A **2-hop bounded graph traversal** in Neo4j identifies Amiodarone as the shared competitive clearance bridge, surfacing the hidden toxicity mechanism to the clinician.

---

## 🏛️ System Architecture & Polyglot Persistence

```
+---------------------------------------------------------------------------------------+
|                               Next.js 14 Web Application                              |
|          Bespoke Vanilla CSS Design System • Patient Screening • Graph Visualizer     |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
|                       Next.js Server-Side App Router (Edge API)                       |
|   • Session Validation & JWT Verification (jose)                                      |
|   • Route Protection Middleware (/admin vs /dashboard)                                |
|   • Cross-Database Query Orchestration & Parameter Sanitization                       |
+---------------------------------------------------------------------------------------+
                     │                                           │
                     ▼                                           ▼
+------------------------------------------+ +------------------------------------------+
|          PostgreSQL 16 (Relational)      | |             Neo4j 5 (Graph DBMS)         |
| • ACID Transactional Regimens            | | • Native Labeled Property Graph Model    |
| • BCNF / 4NF Normalized Schemas          | | • Index-Free Adjacency ($O(1)$ Pointers)  |
| • Canonical Constraints (A < B)          | | • Bounded Multi-Hop Traversal (2..3 Hops)|
| • PL/pgSQL Stored Screening Engine       | | • Declarative Cypher Pattern Matching    |
| • Active Database Event Triggers         | | • Force-Directed Physics Graph Rendering |
| • DB-Level Least-Privilege RBAC          | | • Uniqueness Constraints & Schema Indexes|
+------------------------------------------+ +------------------------------------------+
```

### Why Relational Alone Fails for Multi-Hop Graph Traversal
In relational databases, searching for 2-hop or 3-hop bridges requires **recursive self-joins** (`WITH RECURSIVE` CTEs) over tables containing hundreds of thousands of interaction rows. Relational join latency degrades exponentially ($O(N^d)$) due to repeated index lookups and join scans. 

In contrast, **Neo4j implements Index-Free Adjacency**: nodes point directly to adjacent nodes via bidirectional memory pointers. Traversing a multi-hop path costs **$O(1)$ pointer dereferences per step**, maintaining consistent sub-15ms response times regardless of graph size.

---

## 🛠️ Database Engineering Highlights (DBMS Level 3 Rubric)

### 1. Mathematical Normalization (BCNF & 4NF)
* **Fourth Normal Form (4NF):** Decomposed pairwise interactions into `ddi_pairs`, `ddi_severities`, and `ddi_mechanisms`. Resolves Multi-Valued Dependencies ($pair\_id \twoheadrightarrow severity \mid mechanism$), eliminating multiplicative Cartesian update anomalies.
* **Boyce-Codd Normal Form (BCNF):** Every determinant in `patients` and `drugs` is a unique superkey, eliminating partial and transitive functional dependencies.

### 2. Physical Schema Constraints & Invariants
* **Canonical Ordering Invariant:** Enforces `CHECK (drug_a_id < drug_b_id)` and `UNIQUE(drug_a_id, drug_b_id)`. Halves storage overhead by ensuring undirected interaction edges are stored exactly once.
* **Bounded Hop Count Constraint:** Enforces `CHECK (hop_count BETWEEN 1 AND 3)` at the database level. Prevents exponential combinatorial query explosion ($O(k^d)$) and eliminates clinically meaningless "Six Degrees of Separation" network noise.
* **Synthetic Data Guardrail:** Enforces `CHECK (is_synthetic = TRUE)` on patient records, establishing a cryptographic privacy firewall that prevents accidental ingestion of real human health data (PHI).

### 3. Active Procedural SQL & Database Triggers
* **Stored Screening Function (`fn_perform_patient_direct_screening`):** Encapsulates patient validation, prescription filtering, symmetric pair resolution, and session creation within a single atomic PL/pgSQL function.
* **Real-Time Audit Trigger (`trg_assessment_findings_count`):** An `AFTER INSERT OR DELETE` trigger on `assessment_findings` that automatically recalculates and updates summary metrics (`direct_interaction_count`, `multi_hop_candidate_count`) on the parent `risk_assessments` table. Configured with `SECURITY DEFINER SET search_path = public, pg_temp` to prevent search-path hijacking attacks.

### 4. Query Plan Optimization (`EXPLAIN ANALYZE`)
* Designed composite B-tree indexes (`idx_prescriptions_patient_status`, `idx_ddi_pairs_lookup`).
* Demonstrated an **85% reduction in execution cost** (Seq Scan Cost 28.50 $\to$ Index Scan Cost 4.25) under PostgreSQL `EXPLAIN ANALYZE`.

### 5. Multi-Layer Defense-in-Depth RBAC
* **Edge Layer:** Next.js `middleware.ts` cryptographically inspects JWT session tokens, blocking unauthorized URL routes.
* **Storage Layer:** Native PostgreSQL engine roles (`role_doctor` vs `role_admin`). `role_doctor` is granted least-privilege clinical access and explicitly blocked via `REVOKE ALL` from the credentials table (`user_accounts`).

---

## 📊 Automated Verification & Test Results (67/67 Passing)

The repository includes a comprehensive, multi-layered automated test suite ensuring end-to-end reliability:

```bash
# 1. Cross-Database Integration Tests (Postgres + Neo4j + APIs)
npm run test:integration
# Result: 30/30 PASS (Patient registry, direct discovery, 2-hop bridge, triggers, guardrails)

# 2. Authentication & Server-to-Database RBAC Tests
npm run test:auth
# Result: 26/26 PASS (Bcrypt verification, JWT tamper resistance, HTTP 403, PostgreSQL DB-level RBAC)

# 3. Data Preprocessing & Mathematical Invariant Tests
python3 -m unittest discover tests/unit/
# Result: 11/11 PASS (Canonical ordering, referential integrity, domain validation)
```
**Total Verified Assertions:** **67 Passed, 0 Failed.**

---

## 🚀 Quickstart & Local Execution

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
* [Node.js](https://nodejs.org/) (v18 or v20 LTS).
* [pgAdmin 4](https://www.pgadmin.org/) (Optional, for graphical SQL query inspection).

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Saatwik-V/drug-interaction-risk-discovery.git
cd drug-interaction-risk-discovery
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Launch Docker Containers (Postgres 16 + Neo4j 5)
```bash
docker compose up -d
```
* **PostgreSQL:** Running on `localhost:5432` (`db: drug_interaction_db`, `user: postgres`, `password: postgres`)
* **Neo4j Browser:** Running on `http://localhost:7474` (`user: neo4j`, `password: password123`)

### 4. Seed Relational & Graph Databases
```bash
# Initialize PostgreSQL schema, constraints, stored procedures, and clinical cohorts
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/01_schema.sql
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/02_constraints_indexes.sql
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/03_seed_synthetic.sql
docker exec -i drug-interaction-postgres psql -U postgres -d drug_interaction_db < database/postgres/05_roles_rbac.sql

# Seed Neo4j graph nodes and interaction edges
docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/01_constraints.cypher
docker exec -i drug-interaction-neo4j cypher-shell -u neo4j -p password123 < database/neo4j/02_import.cypher
```

### 5. Launch the Next.js Application
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

#### Demo Credentials:
| Role | Username | Password | Access Capabilities |
|---|---|---|---|
| **Clinician / Doctor** | `dr_sharma` | `Doctor@123` | Patient cohort search, prescription orders, real-time risk screening. |
| **System Administrator** | `admin` | `Admin@123` | User account administration, role assignment, system audit oversight. |

---

## 🔮 Future Directions & Production Roadmap

This project is designed as an extensible foundation for production healthcare data engineering. Key future milestones include:

```
                  [ Hospital EHR (Epic / Cerner) ]
                                 │
                                 ▼ (HL7 FHIR API / OAuth2)
               [ SMART on FHIR Microservice Gateway ]
                                 │
        ┌────────────────────────┴────────────────────────┐
        ▼                                                 ▼
[ Managed PostgreSQL ]                         [ Neo4j AuraDB Enterprise ]
(AWS RDS Multi-AZ HIPAA)                       (In-Memory Knowledge Graph)
        │                                                 │
        ▼                                                 ▼
[ Pharmacogenomics (PGx) ]                     [ GNN Link Prediction ]
(Patient CYP2C9 Variants)                      (Novel Drug-Drug Predictions)
```

1. **Pharmacogenomics (PGx) Integration:**
   * Introduce patient metabolic genotype nodes (e.g. `CYP2D6 *4`, `CYP2C19 *2` poor metabolizers). Edge traversal weights will dynamically adjust based on individual genetics, converting standard drug paths into personalized high-risk warnings.
2. **Graph Neural Networks (GNNs) for Novel Interaction Prediction:**
   * Train Relational Graph Convolutional Networks (RGCN) on the Neo4j topology to predict uncharacterized interaction hazards between newly approved FDA compounds.
3. **SMART on FHIR Hospital Deployment:**
   * Package the application as an embedded SMART-on-FHIR microservice, allowing it to embed directly inside hospital EHR interfaces (Epic Systems, Oracle Cerner) via standard HL7 `MedicationRequest` hooks.
4. **Pharmacokinetic Half-Life Modeling:**
   * Integrate TimescaleDB with PostgreSQL to model drug half-lives ($t_{1/2}$) and administration intervals, factoring in active metabolic decay curves.

---

## 📚 Project Documentation & Defense Materials

| Document | Location | Purpose |
|---|---|---|
| **Viva Demo Execution Guide** | [`FINAL_VIVA_DEMO_GUIDE.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/FINAL_VIVA_DEMO_GUIDE.md) | Step-by-step query execution cheat sheet ordered strictly by Rubrics 1–14. |
| **Comprehensive Viva Prep Guide** | [`COMPREHENSIVE_VIVA_PREP_GUIDE.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/reviews/COMPREHENSIVE_VIVA_PREP_GUIDE.md) | Theoretical crash course, normalization proofs, and examiner Q&A defense. |
| **Chen ER Diagram (Vector PDF)** | [`ER_Diagram_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf) | Formal Peter Chen conceptual entity-relationship model. |
| **Relational Schema (Vector PDF)** | [`Relational_Schema_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf) | Mapped logical relational schema with all foreign keys, keys, and constraints. |
| **Technology Justification** | [`TECHNOLOGY_JUSTIFICATION.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/TECHNOLOGY_JUSTIFICATION.md) | In-depth polyglot persistence engineering justification. |
| **Data Normalization Proof** | [`NORMALIZATION.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/NORMALIZATION.md) | Formal functional dependency proofs through 1NF, 2NF, 3NF, BCNF, and 4NF. |

---

## ⚖️ License & Ethical Disclaimers

* **Biomedical Data Sources:** DDInter ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)) and MecDDI (Educational/Non-Commercial Research License).
* **Software Code:** Academic Non-Commercial Open-Source License.
* **Non-Clinical Disclaimer:** This software is an academic database-systems prototype developed for DBMS Experiential Learning. It is **not** certified as a clinical diagnostic or prescribing system. All patient data is synthetic. Multi-hop graph traversals output candidate mechanism hypotheses for clinical review, not verified adverse drug events.