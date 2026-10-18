# Project Documentation Index

This directory serves as the central documentation repository for the **Patient-Specific Multi-Hop Drug Interaction Risk Discovery** project.

---

## 1. Primary Project Documents

| Document | Relative Path | Purpose & Authority |
|---|---|---|
| **Official DBMS Level 3 Evaluation Criteria** | [`course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf) | **Grading Authority**: The official PES University evaluation rubric (August–December 2026, 50 marks total). Defines all required grading criteria across database design, creation, SQL queries, advanced concepts, web integration, auth, and documentation. |
| **Project Pitch** | [`project-plan/PROJECT_PITCH.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/PROJECT_PITCH.pdf) | **Overall Vision**: Describes the problem statement, proposed dual-database architecture (PostgreSQL + Neo4j), conceptual biomedical evidence models, long-term scope, and envisioned experiments. |
| **Four-Day Implementation Plan** | [`project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md) | **Execution Contract**: Adapts the broader pitch into a focused, vertical-slice execution plan tailored to our four-day deadline. Sets daily exit gates, deliverables, and immediate implementation priorities. |

> [!IMPORTANT]
> **Decision Hierarchy & Scope Boundary**
> 1. **Official Rubric**: What must be demonstrated to satisfy course assessment requirements.
> 2. **Four-Day Implementation Plan**: What we commit to building and verifying within our current timeframe.
> 3. **Project Pitch**: The broader motivation, long-term vision, and future directions.
>
> The project pitch describes capabilities, expanded datasets, and extended experiments that extend beyond our immediate deadline. All ongoing and future implementation choices must follow the four-day plan while ensuring full compliance with the official rubric.

---

## 2. Documentation Subdirectories

The following folders are reserved for project artifacts generated during subsequent phases. They will be populated with genuine artifacts as implementation progresses; no placeholder or fabricated artifacts should be added prematurely:

- **[`architecture/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/architecture)**: System architecture diagrams, component interaction flows, and technology justifications (PostgreSQL + Neo4j + Next.js).
- **[`database-design/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design)**: Entity-Relationship (ER) diagrams, relational table definitions, schema normalization notes, and Neo4j graph property graph models (labels, relationships, properties).
- **[`data-dictionary/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/data-dictionary)**: Detailed column/attribute and node/edge descriptions, data types, constraints, and provenance metadata.
- **[`testing/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/testing)**: Test strategies, unit/integration test plans, security verification logs, and test coverage summaries.
- **[`experiments/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/experiments)**: Empirical evaluation logs, query execution plan comparisons, graph traversal depth/performance benchmarks, and detection coverage reports.
- **[`screenshots/`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/screenshots)**: Real application screenshots demonstrating UI flows, RBAC behavior (Doctor vs. Admin), patient views, and risk explanation graphs.
