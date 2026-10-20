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

## 2. Phase 1 Deliverables Index

### 2.1 Database Design & Architecture
- **[Conceptual ER Diagram (draw.io XML)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.drawio)**: Editable diagrams.net Chen notation ER diagram with (min, max) structural constraints.
- **[Conceptual ER Diagram (Vector PDF)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf)**: High-resolution vector export for reporting and submission.
- **[Conceptual ER Diagram (PNG Image)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.png)**: High-resolution raster preview.
- **[Conceptual ER Model Specification](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_MODEL.md)**: Entity, relationship, and (min, max) cardinality catalog.
- **[Relational Schema Diagram (draw.io XML)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.drawio)**: Editable diagrams.net relational table diagram with FK connectors and constraints.
- **[Relational Schema Diagram (Vector PDF)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf)**: Vector export of relational table layouts.
- **[Relational Schema Diagram (PNG Image)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.png)**: High-resolution raster preview.
- **[Relational Schema Specification](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/RELATIONAL_SCHEMA.md)**: Full formal relational notation, primary/foreign keys, CHECK constraints, and referential actions.
- **[Data Dictionary](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/DATA_DICTIONARY.md)**: Comprehensive column-level catalog with data types, nullability, constraints, and provenance origins.
- **[Normalization Analysis](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/NORMALIZATION.md)**: Functional dependency proofs for BCNF and 4NF, explaining unordered pair deduplication and provenance isolation.
- **[Neo4j Graph Schema](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/GRAPH_SCHEMA.md)**: Property graph node labels, relationship types, edge property design, and multi-hop traversal semantics.
- **[Technology Justification](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/TECHNOLOGY_JUSTIFICATION.md)**: Architectural rationale for PostgreSQL + Neo4j, Next.js, and analysis regarding vector databases vs. graph stores under the course rubric.

### 2.2 Data Audit & Manifests
- **[Source Data Audit Report](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/data-dictionary/source-audit.md)**: Deep statistical audit of all 17 CSV files (row counts, unique entities, pairs, severity distributions, mechanisms, and cross-source mapping).
- **[Data Sources & Licensing](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/manifests/data_sources.md)**: Terms of service, CC BY-NC-SA 4.0 conditions, MecDDI All-Rights-Reserved notices, and data boundaries.
- **[Source Manifest CSV](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/manifests/source_manifest.csv)**: SHA-256 checksums, byte sizes, and metadata records for all 17 source files.
- **[Validation Report (JSON)](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/data/processed/validation_report.json)**: Automated integrity report verifying 0 invariant violations across 219,040 canonical pairs and 1,968 drugs.

### 2.3 Implementation Scripts
- **PostgreSQL DDL**: [`database/postgres/01_schema.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/01_schema.sql), [`database/postgres/02_constraints_indexes.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/02_constraints_indexes.sql), [`database/postgres/03_seed_synthetic.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/03_seed_synthetic.sql), [`database/postgres/04_required_queries.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/04_required_queries.sql).
- **Neo4j Cypher**: [`database/neo4j/01_constraints.cypher`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/neo4j/01_constraints.cypher), [`database/neo4j/02_import.cypher`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/neo4j/02_import.cypher), [`database/neo4j/03_queries.cypher`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/neo4j/03_queries.cypher).
- **Preprocessing Pipeline**: [`scripts/preprocessing/run_all.py`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/scripts/preprocessing/run_all.py).
- **Unit Invariant Tests**: [`tests/unit/test_data_invariants.py`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/tests/unit/test_data_invariants.py).
