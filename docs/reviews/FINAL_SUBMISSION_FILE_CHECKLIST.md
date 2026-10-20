# Final Submission File & Deliverables Checklist

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course:** PES University DBMS Experiential Learning Level 3 (Aug–Dec 2026)  
**Date of Audit:** October 20, 2026  
**Evaluation Standard:** Official DBMS Level 3 Evaluation Criteria (`docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`)  

---

## 1. Deliverables Checklist by Rubric Category

### Category 1: Database Design (5 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| Conceptual ER Diagram (XML) | `docs/database-design/ER_Diagram_Final.drawio` | Yes | XML | Editable Chen notation diagram with 10 entities, 12 relationships, (min, max) constraints. |
| Conceptual ER Diagram (PDF) | `docs/database-design/ER_Diagram_Final.pdf` | Yes | PDF | High-resolution vector export for submission reports. |
| Conceptual ER Diagram (PNG) | `docs/database-design/ER_Diagram_Final.png` | Yes | PNG | High-resolution raster preview (@ 2x scale). |
| Conceptual ER Model Spec | `docs/database-design/ER_MODEL.md` | Yes | Markdown | Detailed entity catalog, role definitions, and structural constraint matrix. |
| Relational Schema Diagram (XML) | `docs/database-design/Relational_Schema_Final.drawio` | Yes | XML | Editable relational table diagram with 11 foreign-key connectors. |
| Relational Schema Diagram (PDF) | `docs/database-design/Relational_Schema_Final.pdf` | Yes | PDF | Vector export of relational tables and constraints. |
| Relational Schema Diagram (PNG) | `docs/database-design/Relational_Schema_Final.png` | Yes | PNG | High-resolution raster preview (@ 2x scale). |
| Relational Schema Spec | `docs/database-design/RELATIONAL_SCHEMA.md` | Yes | Markdown | Formal relational notation `R(A, B, ...)`, constraints, and referential actions. |
| Data Dictionary | `docs/database-design/DATA_DICTIONARY.md` | Yes | Markdown | Catalog of all 10 tables and 75 column attributes with provenance tags. |
| Normalization Proofs | `docs/database-design/NORMALIZATION.md` | Yes | Markdown | Functional dependency derivations, BCNF proofs, and 4NF mechanism isolation proof. |

---

### Category 2: Database Creation (9 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| PostgreSQL Relational DDL | `database/postgres/01_schema.sql` | Yes | SQL | Complete DDL for 10 tables with primary, foreign, unique, and check constraints. |
| Constraints & Indexes | `database/postgres/02_constraints_indexes.sql` | Yes | SQL | Additional B-Tree indexes, views, stored functions, and triggers. |
| Neo4j Schema Constraints | `database/neo4j/01_constraints.cypher` | Yes | Cypher | Uniqueness constraints on `:Drug(drug_id)` and indexes on `canonical_name`. |
| Neo4j Data Import Script | `database/neo4j/02_import.cypher` | Yes | Cypher | Ingests canonical drugs and `[:INTERACTS_WITH]` property relationships. |
| Technology Justification | `docs/database-design/TECHNOLOGY_JUSTIFICATION.md` | Yes | Markdown | Architectural justification of PostgreSQL + Neo4j and defense against vector stores. |
| Docker Orchestration | `docker-compose.yml` | Yes | YAML | Multi-container configuration for PostgreSQL 16-alpine and Neo4j 5-community. |

---

### Category 3: SQL Operations and Queries (8 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| Synthetic Seed DML | `database/postgres/03_seed_synthetic.sql` | Yes | SQL | Synthetic patient cohorts, active/discontinued prescriptions, and test findings. |
| Comprehensive SQL Suite | `database/postgres/04_required_queries.sql` | Yes | SQL | DML, multi-table joins, correlated subqueries, `DENSE_RANK()`, and recursive graph CTE. |

---

### Category 4: Advanced Database Concepts (13 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| Stored Screening Function | `database/postgres/02_constraints_indexes.sql` | Yes | PL/pgSQL | `fn_perform_patient_direct_screening()` executing direct pairwise discovery. |
| Automated Counter Trigger | `database/postgres/02_constraints_indexes.sql` | Yes | PL/pgSQL | `trg_assessment_findings_count` executing `fn_update_assessment_counts()` with `SECURITY DEFINER SET search_path = public, pg_temp`. |
| Cypher Traversal Queries | `database/neo4j/03_queries.cypher` | Yes | Cypher | Bounded 1-hop, 2-hop, and 3-hop multi-path Cypher traversals. |
| NoSQL CRUD Operations | `database/neo4j/03_queries.cypher` | Yes | Cypher | Full Create, Read, Update, Delete operations on test graph compound. |

---

### Category 5: Web Application and Database Integration (5 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| Global Styling & Theme | `app/globals.css` | Yes | CSS | Clinical dark-mode design system with glassmorphic cards and severity hierarchy. |
| Navigation Component | `components/Navbar.tsx` | Yes | TypeScript | Role-aware navigation header with active user display and logout trigger. |
| Login Interface | `app/login/page.tsx` | Yes | TypeScript | Authentication view with viva demo quick-fill buttons and `<Suspense>` boundary. |
| Doctor Dashboard | `app/dashboard/page.tsx` | Yes | TypeScript | Patient cohort metrics, search filter, and patient profile table. |
| Patient Detail & Screening | `app/patients/[id]/page.tsx` | Yes | TypeScript | Medication regimen viewer, graph search radius selector, and risk cards. |
| Alerts Audit Log | `app/alerts/page.tsx` | Yes | TypeScript | Historical assessment session log with expandable finding breakdowns. |
| Admin Console Views | `app/admin/page.tsx` & `/users/page.tsx` | Yes | TypeScript | System overview and user provisioning interface. |
| Cross-Database Orchestrator | `lib/risk-analysis/orchestrator.ts` | Yes | TypeScript | Coordinates dual-database queries between PostgreSQL and Neo4j. |
| Patient Service Module | `lib/postgres/patient-service.ts` | Yes | TypeScript | PostgreSQL relational query client executing under `app_doctor_user`. |
| Graph Service Module | `lib/neo4j/graph-service.ts` | Yes | TypeScript | Neo4j Bolt driver client executing bounded Cypher traversals. |

---

### Category 6: Authentication and Authorization (4 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| Auth Service & Password Hashing | `lib/auth/auth-service.ts` | Yes | TypeScript | Bcrypt credential verification (10 salt rounds) and account retrieval. |
| JWT Session Tokens | `lib/auth/jwt.ts` & `session.ts` | Yes | TypeScript | Signed HS256 tokens stored in secure, HttpOnly, SameSite=Lax cookies. |
| Route Protection Middleware | `middleware.ts` | Yes | TypeScript | Next.js Edge middleware enforcing role authorization (`/admin` vs `/dashboard`). |
| Database-Level RBAC DDL | `database/postgres/05_roles_rbac.sql` | Yes | SQL | Group roles (`role_doctor`, `role_admin`), dedicated users, and explicit table revokes. |

---

### Category 7: Documentation, Testing & Originality (6 Marks)
| Deliverable Artifact | Relative File Path | Exists | Format | Description |
|---|---|:---:|:---:|---|
| Main Project README | `README.md` | Yes | Markdown | Complete project overview, architecture diagram, and setup instructions. |
| Central Docs Index | `docs/README.md` | Yes | Markdown | Navigable catalog linking all project documentation and rubrics. |
| Source Data Audit Report | `docs/data-dictionary/source-audit.md` | Yes | Markdown | In-depth statistical analysis of all 17 source CSV files. |
| Provenance Manifest | `data/manifests/source_manifest.csv` | Yes | CSV | SHA-256 checksums, byte counts, and source URLs for all raw datasets. |
| Licensing Documentation | `data/manifests/data_sources.md` | Yes | Markdown | Attribution and license terms (CC BY-NC-SA 4.0 and academic rights). |
| Auth & RBAC Test Suite | `tests/integration/test_auth_rbac.ts` | Yes | TypeScript | 26 automated assertions testing bcrypt, JWT, route protection, and DB RBAC. |
| Integration Test Suite | `tests/integration/test_day2_integration.ts` | Yes | TypeScript | 30 automated assertions testing patient registry, direct pairs, Neo4j, and triggers. |
| Data Invariant Unit Suite | `tests/unit/test_data_invariants.py` | Yes | Python | 11 automated assertions testing drug mapping, canonical checks, and no synthetic leaks. |
| Viva Demonstration Guide | `docs/reviews/FINAL_VIVA_DEMO_GUIDE.md` | Yes | Markdown | 5-minute presentation script and technical defense Q&A for examiners. |
| Final Acceptance Audit | `docs/reviews/DAY4_FINAL_SUBMISSION_ACCEPTANCE.md` | Yes | Markdown | Comprehensive submission readiness audit report. |

---

## 2. File Hygiene & Tracked Content Verification

- [x] **Zero Raw Dataset Leaks:** Bulk CSVs under `data/raw/` and `data/processed/` are untracked by Git (`.gitignore` enforced).
- [x] **Zero Secret Leaks:** `.env` and `.env.local` are untracked. Only `.env.example` is committed.
- [x] **Zero Build Artifacts:** `.next/`, `node_modules/`, `pgdata/`, and `neo4jdata/` are excluded from version control.
- [x] **No Broken File Links:** All markdown links use valid relative paths matching files on disk.
- [x] **`git diff --check` Passed:** Zero trailing whitespace or syntax errors detected in the working tree.

---

## 3. Recommended Final Actions for the Human User Before Submission

1. **Review Local Changes:**
   Execute `git status` to inspect modified and untracked files:
   ```bash
   git status
   ```
2. **Commit Changes (When Ready):**
   When the user decides to create a checkpoint commit:
   ```bash
   git add README.md docs/ database/ app/ lib/ tests/
   git commit -m "docs: finalize ER diagrams, relational schema, and submission acceptance audit"
   ```
3. **Run Quick Smoke Test:**
   Verify that Docker containers and Next.js development server are running smoothly at `http://localhost:3000`.
