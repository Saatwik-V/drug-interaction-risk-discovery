# Patient-Specific Multi-Hop Drug Interaction Risk Discovery

An experiential learning database-systems prototype for exploring explainable polypharmacy risk using relational data modeling and bounded graph traversal.

---

## 1. Project Overview

Patients taking multiple concurrent medications (polypharmacy) often face adverse interaction risks that simple pairwise drug-drug lookups cannot capture. Complex interactions may arise through shared metabolic pathways, target competition, or sequential physiological effects spanning multiple intermediary biological entities.

This project is a **DBMS-focused decision-support prototype** developed for the PES University DBMS Experiential Learning Level 3 course. It compares conventional pairwise interaction lookup with bounded graph traversal (direct, 2-hop, 3-hop) to provide traceable, evidence-backed explanations of potential risks across synthetic patient medication lists.

> [!NOTE]
> **Scope Disclaimer**: This project is an academic database-systems prototype and research demonstration. It is **not** a clinical diagnostic or prescribing tool, does not claim to discover novel drug interactions, and uses synthetic patient profiles for evaluation.

---

## 2. Proposed Architecture

The planned system integrates relational transactions with graph analytics:

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
| - Patients & Prescriptions  | | - Drug Nodes                |
| - Doctors / User Accounts   | | - Protein / Enzyme Nodes    |
| - Conditions & Medical Logs | | - Biological Pathways       |
| - Audit & Interaction Logs  | | - Documented Adverse Events |
+-----------------------------+ +-----------------------------+
```

- **Frontend & Routing:** Next.js (TypeScript) with App Router, providing distinct views for Doctors (prescribing, reviewing interaction alerts, exploring graph paths) and Administrators (managing reference datasets, viewing audit logs).
- **Relational Storage (PostgreSQL):** Manages structured transactional entities with strong ACID guarantees, foreign-key referential integrity, constraints, stored procedures, triggers, and analytical SQL queries.
- **Graph Storage (Neo4j):** Models documented biomedical entities and relationships, enabling bounded Cypher graph traversals (1-hop direct, 2-hop shared enzyme/target, 3-hop pathway/adverse event cascade).
- **Coordination Layer:** Server-side API handlers orchestrating relational queries, Cypher traversals, result aggregation, and authorization.

*(Note: Architecture components are proposed and planned; implementation will proceed according to the execution plan.)*

---

## 3. Current Scope and Four-Day Objective

Our immediate execution objective is to deliver a verified vertical slice that satisfies the DBMS Level 3 evaluation criteria within a four-day timeframe:

- **End-to-End Vertical Slice:** A functional Next.js application backed by PostgreSQL and Neo4j.
- **Relational Integrity:** PostgreSQL schema featuring primary keys, foreign keys, check constraints, indexes, triggers, and stored procedures/functions.
- **Graph Risk Traversal:** Bounded 1-hop, 2-hop, and 3-hop path queries identifying candidate interaction pathways with provenance.
- **Demonstrated SQL Depth:** DDL, DML, advanced joins, nested/correlated queries, CTEs, and window/aggregate functions.
- **Role-Based Access Control (RBAC):** Server-side enforcement distinguishing Doctor and Administrator access.
- **Testing & Verification:** Reproducible unit, integration, and security test cases.
- **Documentation & Evidence:** Transparent contribution logs, architecture documentation, and schema descriptions.

---

## 4. Key Project Documents

The repository contains three primary guiding documents located in the [`docs/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs) directory:

1. **[`DBMS Level 3 Evaluation Criteria`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf)**:
   *Authoritative Grading Rubric* — The official PES University assessment standard detailing all 50 marks across design, SQL operations, advanced concepts, web integration, and testing.

2. **[`Project Pitch`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/PROJECT_PITCH.pdf)**:
   *Conceptual Vision* — The complete proposal detailing the problem statement, biomedical rationale, graph schema concepts, and longer-term research goals.

3. **[`Four-Day Implementation Plan`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md)**:
   *Execution Contract* — The operational roadmap establishing priorities, vertical slice boundaries, daily deliverables, and exit gates for the immediate submission.

For guidance on project governance, refer to the [Documentation Index](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/README.md) and [`AGENTS.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/AGENTS.md).

---

## 5. Current Status

The repository is currently in its **initial setup and organization phase**:
- Source documents and evaluation rubrics have been cataloged and indexed.
- Repository structure and baseline configurations have been established.
- External dataset availability, schema requirements, and licensing constraints are pending investigation.
- Application development, database initialization, and data imports have **not yet begun**.

---

## 6. Environment and Setup

A template for required environment variables is provided in [`.env.example`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/.env.example).

Step-by-step installation, database setup, and execution instructions will be documented here once the data access strategy and implementation framework are initialized.