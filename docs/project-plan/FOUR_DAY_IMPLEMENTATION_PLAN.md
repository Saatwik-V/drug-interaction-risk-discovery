# Patient-Specific Multi-Hop Drug Interaction Risk Discovery
## Four-Day End-to-End Implementation Plan

**Course:** DBMS Experiential Learning — Level 3  
**Team:** 2 members  
**Primary goal:** Deliver a reproducible, working DBMS project that satisfies the Level 3 requirements and can be demonstrated confidently in four days.

---

## 0. Reality check and execution strategy

The original project pitch proposes a broader, ten-week system: PostgreSQL + Neo4j, documented DrugBank/FAERS relationships, synthetic patients, a Next.js application, two roles, advanced database concepts, and experiments. Four days is not enough to implement every proposed feature at full scale and validate it rigorously.

Therefore, implement a **vertical slice first**: a small, verifiable end-to-end system that works, then expand only if the core is stable. Do not claim features, dataset sizes, clinical validity, or performance results that have not been implemented and measured.

### Four-day definition of done

By the end of Day 4, aim to have:

- [ ] A Next.js web application that runs locally.
- [ ] PostgreSQL schema with primary keys, foreign keys, constraints, indexes, and useful seed data.
- [ ] Neo4j graph with documented, source-backed relationships and stable drug identifiers.
- [ ] A bounded direct / 2-hop / 3-hop analysis flow that returns traceable candidate pathways.
- [ ] Synthetic patients and prescriptions for repeatable testing.
- [ ] Doctor and Admin roles with server-side authorization.
- [ ] Meaningful SQL operations and queries: INSERT, SELECT, UPDATE, DELETE, JOINs, aggregates, nested/correlated queries, and CTE examples as appropriate.
- [ ] At least four clearly demonstrated advanced DB concepts; target the rubric's specified concepts including functions/procedures, triggers, CTEs, indexing, transactions, and graph/NoSQL functionality.
- [ ] A working UI for patient medication lists and risk explanations.
- [ ] Test cases, experiment scripts/results, README, architecture/schema documentation, and evidence of each team member's contribution.

**Scope rule:** Build the smallest honest working implementation first. If a feature cannot be completed and tested, document it as a limitation rather than claiming it is done.

---

## 1. Project definition

### Problem statement

Patients taking multiple concurrent medications can have potential interaction risks that are not captured by checking medication pairs alone. This project models patient prescriptions in a relational database and documented pharmacological relationships in a graph database, then traverses bounded paths to return explainable candidate risks.

### What this project is—and is not

**It is:**
- A database-systems and decision-support prototype.
- A comparison of pairwise interaction lookup with bounded graph traversal.
- A system that returns pathways, relationship types, hop counts, and evidence provenance.
- A project using synthetic patient data for systems evaluation.

**It is not:**
- A clinical diagnostic or prescribing tool.
- A system that discovers or proves new drug interactions.
- An ML model predicting previously unknown interactions.
- Evidence of real patient outcomes.

A graph path is not automatically clinically meaningful. Label results as documented direct interactions, documented mechanism/pathway candidates, or uncorroborated graph connections. Never present synthetic-patient output as clinical findings.

---

## 2. Rubric-first prioritization

The Level 3 evaluation rubric totals 50 marks:

| Criterion | Marks | Implementation priority |
|---|---:|---|
| Database design | 5 | ER diagram, schema, keys, relationships, constraints |
| Database creation | 9 | PostgreSQL DDL/constraints, Neo4j database, technology justification |
| SQL operations and queries | 8 | DML, joins, nested/correlated/recursive queries, aggregates |
| Advanced database concepts | 13 | Advanced SQL, functions/procedures, triggers, CTEs, NoSQL/graph feature |
| Web application and database integration | 5 | Next.js UI, backend/API, both databases integrated |
| Authentication and authorization | 4 | Authentication, at least two roles, server-side/database-facing access control |
| Documentation, Git/GitHub, demo, testing, originality | 6 | README, test evidence, contribution history, demo |
| **Total** | **50** | |

**Priority order:** data/schema → database scripts → graph traversal → backend integration → advanced features → minimal UI/auth → experiments/tests → documentation/polish.

Do not spend Day 1 on visual design. Do not leave graph traversal until Day 4.

---

## 3. Recommended architecture

```text
Browser
  |
  v
Next.js UI
  |
  v
Next.js Route Handlers / API
  |-- authentication + role authorization
  |-- input validation
  |-- risk-analysis orchestration
  |
  |--------------------|
  v                    v
PostgreSQL             Neo4j
- patients             - Drug nodes
- doctors/users        - Protein/Enzyme nodes
- drugs                - Condition nodes
- conditions           - AdverseEvent nodes
- prescriptions        - documented relationships
- alerts/audit         - evidence provenance
```

The browser must not connect directly to either database. Keep database credentials in environment variables. Use SQL explicitly for DBMS demonstrations even if an ORM is used for ordinary application operations.

### Suggested stack

- Next.js + TypeScript
- PostgreSQL
- Neo4j
- `pg` or an ORM with explicit SQL where needed
- Official Neo4j JavaScript driver
- Auth.js/NextAuth.js or a simple, securely implemented course-appropriate authentication flow
- bcrypt/Argon2 password hashing
- Vitest/Jest and API/database integration tests
- Git + GitHub

Avoid adding a vector database, ML prediction model, microservices, or unrelated features. They are not necessary for the chosen problem and will consume scarce time.

---

## 4. Scope to freeze before coding

### Core scope

1. Synthetic patient records and prescriptions.
2. Drug entities with a stable source identifier.
3. Documented direct drug–drug relationships where available.
4. A limited, evidence-backed set of mechanism relationships for graph paths.
5. Bounded traversal at up to three hops.
6. Pairwise baseline compared with graph results.
7. PostgreSQL transaction/integrity features.
8. Doctor and Admin roles.
9. A Next.js UI that demonstrates the full workflow.
10. Measured, clearly described experiments.

### Original pitch targets—not Day 1 requirements

The pitch suggests 500–2,000 drugs, 100–300 conditions, a few thousand documented relationships, 1,000–5,000 synthetic patients and 2–8 medications per patient. Treat these as expansion targets. Start with a small subset that can be verified; scale only when import and traversal work.

### Data sourcing and licensing

- Obtain DrugBank academic/education data only through permitted access. Check terms before using or redistributing it.
- FAERS is a public adverse-event reporting resource, but reports are not proof of causation.
- Record source, source record ID, import date, and the evidence available for each relationship.
- Do not invent relationship facts to make a graph path appear.
- Keep restricted source files out of GitHub unless redistribution is explicitly allowed.
- Generate synthetic patients and medication lists using drug IDs that exist in the imported drug subset.

### Fallback if data access blocks progress

Do not fabricate pharmacological claims. Use a tiny permitted/source-backed sample, clearly document its origin, and build the importer to accept the full dataset later. If only a structural demonstration is possible, label all demonstration data as synthetic fixtures and do not present it as DrugBank- or FAERS-validated evidence. Ask the instructor whether the fallback is acceptable.

---

## 5. Repository layout

Create this immediately:

```text
drug-interaction-risk-discovery/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── patients/
│   ├── alerts/
│   ├── admin/
│   └── api/
├── components/
├── lib/
│   ├── auth/
│   ├── postgres/
│   ├── neo4j/
│   ├── risk-analysis/
│   └── validation/
├── database/
│   ├── postgres/
│   │   ├── 01_schema.sql
│   │   ├── 02_constraints.sql
│   │   ├── 03_indexes_views.sql
│   │   ├── 04_functions.sql
│   │   ├── 05_triggers.sql
│   │   ├── 06_seed.sql
│   │   └── 07_queries.sql
│   └── neo4j/
│       ├── constraints.cypher
│       ├── import.cypher
│       └── traversal.cypher
├── data/
│   ├── samples/
│   └── synthetic/
├── scripts/
│   ├── import-data.*
│   ├── generate-patients.*
│   └── run-benchmarks.*
├── tests/
│   ├── unit/
│   ├── integration/
│   └── security/
├── experiments/
│   ├── coverage/
│   ├── depth/
│   └── performance/
├── docs/
│   ├── er-diagram.*
│   ├── architecture.md
│   ├── data-dictionary.md
│   └── test-results.md
├── .env.example
├── .gitignore
└── README.md
```

Adapt extensions and folders to the framework you actually use; do not create empty files just to imitate this tree. Put only genuinely synthetic or redistributable sample data in the repository.

---

# DAY 1 — Freeze scope, design databases, get a tiny graph working

## Day 1 objective

At the end of Day 1, both members should agree on the schema and be able to run a small PostgreSQL database and a small Neo4j graph locally. No full UI is required yet.

### Block 1 — Kickoff and environment (first 1–2 hours)

**Both members**
- [ ] Create the GitHub repository.
- [ ] Add `.gitignore` and `.env.example`.
- [ ] Decide how both members will run the same environment.
- [ ] Confirm PostgreSQL and Neo4j access and credentials.
- [ ] Create the Next.js + TypeScript application skeleton.
- [ ] Write a one-page scope and acceptance criteria.
- [ ] Confirm data access and licensing.

Suggested Git branches:
- `main`: stable, runnable version
- `feat/postgres-schema`
- `feat/neo4j-import`
- `feat/api-ui`
- Merge via small, tested commits. Avoid committing secrets or restricted data.

### Block 2 — Data inventory and IDs (1–2 hours)

- [ ] Inspect the available source fields and example records.
- [ ] Determine the stable identifier for each drug.
- [ ] Decide how source relationship records map to graph relationships.
- [ ] Define provenance fields: source name, source record ID, mechanism/evidence text if provided.
- [ ] Select a manageable initial set of drugs and relationships.
- [ ] Generate a small synthetic patient/prescription seed set.

Deliverable: `docs/data-dictionary.md` and a source/provenance note.

### Block 3 — Database design (2 hours)

#### Proposed PostgreSQL tables

- `patients(patient_id, name, date_of_birth, gender)`
- `doctors(doctor_id, name, specialization)`
- `users(user_id, username, password_hash, role, doctor_id)`
- `drugs(drug_id, drugbank_id, name, category)`
- `conditions(condition_id, name, icd_code)`
- `patient_conditions(patient_id, condition_id, diagnosis_date, status)`
- `prescriptions(prescription_id, patient_id, doctor_id, drug_id, dosage, start_date, end_date, status)`
- `alerts(alert_id, patient_id, prescription/analysis reference as appropriate, severity/category, pathway_json, evidence_summary, created_at, acknowledged_by)`
- Optional `risk_analysis_runs` or `outbox_events` for auditability and reliable asynchronous analysis.

Normalize many-to-many relationships using junction tables. Adjust columns after inspecting the actual data. Document all primary keys, foreign keys, cardinalities, and constraints.

#### PostgreSQL constraints to include

- Primary keys and foreign keys
- Required fields with `NOT NULL`
- Positive dosage check
- Valid date ordering
- Unique source drug identifiers
- Duplicate-active-prescription prevention with a partial unique index or another correctly scoped constraint
- Appropriate status constraints

#### Neo4j labels and relationship types

Nodes:
- `Drug`
- `Protein`
- `Enzyme`
- `Condition`
- `AdverseEvent`

Relationships only when supported by source data:
- `INTERACTS_WITH`
- `INHIBITS`
- `TARGETS`
- `METABOLIZES`
- `CAUSES`
- `INCREASES_RISK_OF`
- `TREATS`

Define a clear identity mapping between PostgreSQL `drugs.drugbank_id` and Neo4j `Drug.drugbank_id`.

Deliverables:
- [ ] ER diagram
- [ ] Relational schema
- [ ] Graph schema
- [ ] Technology choice justification
- [ ] Data dictionary

### Block 4 — First working database prototype (2–3 hours)

**Member A: PostgreSQL**
- [ ] Write and execute `01_schema.sql`.
- [ ] Add constraints and indexes.
- [ ] Insert a small seed dataset.
- [ ] Test primary key, foreign key and invalid dosage failures.
- [ ] Commit working SQL scripts.

**Member B: Neo4j**
- [ ] Write unique constraints on stable drug IDs.
- [ ] Import the selected documented nodes and relationships.
- [ ] Add source/evidence properties.
- [ ] Test a direct interaction query.
- [ ] Write an initial bounded traversal query.
- [ ] Commit import and query scripts.

**Both**
- [ ] Review one another's code.
- [ ] Run a clean setup from scripts if possible.

### Day 1 exit gate

Do not proceed blindly if:
- PostgreSQL tables cannot be recreated from scripts.
- Drug identifiers do not map consistently between databases.
- The graph contains invented or undocumented relationships represented as facts.
- Neither member can explain the ER and graph schema.

---

# DAY 2 — Finish DBMS features and build the risk-analysis API

## Day 2 objective

By the end of Day 2, a script or API should accept a patient's active medication list and return candidate direct and multi-hop pathways. SQL rubric features should be implemented and tested.

### Block 1 — PostgreSQL operations and advanced features (3 hours)

Implement and test:

#### DDL
- [ ] `CREATE`
- [ ] `ALTER`
- [ ] A safe, demonstrable `DROP` operation (use a disposable test object)
- [ ] PK/FK/UNIQUE/CHECK/NOT NULL constraints
- [ ] Indexes and views

#### DML
- [ ] INSERT patient, doctor, drug, condition, prescription
- [ ] SELECT patient and medication details
- [ ] UPDATE dosage/status with validation
- [ ] DELETE a disposable test record while preserving referential integrity

#### Required query examples
- [ ] JOIN query across patients, prescriptions, doctors and drugs
- [ ] GROUP BY and aggregate query for medication/alert counts
- [ ] HAVING query
- [ ] ORDER BY query
- [ ] Nested subquery
- [ ] Correlated subquery
- [ ] CTE
- [ ] Recursive CTE where a suitable relational use case can be demonstrated

#### Advanced DB concepts
- [ ] Stored function/procedure
- [ ] Trigger
- [ ] Transaction with commit
- [ ] Transaction rollback test
- [ ] Index usage and `EXPLAIN ANALYZE`
- [ ] Views

Keep every demonstration in `database/postgres/` and record the expected result or test case.

### Block 2 — Graph import and traversal hardening (2 hours)

- [ ] Ensure node IDs are unique and source identifiers are preserved.
- [ ] Test direct interaction lookup.
- [ ] Test 2-hop and 3-hop traversal separately.
- [ ] Bound traversal depth.
- [ ] Restrict permitted relationship patterns where feasible.
- [ ] Prevent duplicate endpoint pairs and repeated equivalent paths.
- [ ] Avoid cycles and unbounded traversal.
- [ ] Return node names/IDs, relationship types, hop count and provenance.
- [ ] Separate direct documented interactions from indirect candidate pathways.
- [ ] Mark uncorroborated paths rather than presenting them as established facts.

### Example initial Cypher query

```cypher
MATCH path = (d1:Drug)-[*1..3]-(d2:Drug)
WHERE d1.drugbank_id IN $activePatientDrugIds
  AND d2.drugbank_id IN $activePatientDrugIds
  AND d1.drugbank_id < d2.drugbank_id
RETURN
  d1.name AS drug_a,
  d2.name AS drug_b,
  [n IN nodes(path) |
    coalesce(n.name, n.drugbank_id)] AS nodes,
  [r IN relationships(path) |
    {type: type(r), evidence: r.evidence_source}] AS relationships,
  length(path) AS hops
ORDER BY hops ASC
```

This is only a prototype query. The final query must constrain clinically interpretable relationship patterns, preserve evidence, deduplicate paths, and avoid treating arbitrary graph connectivity as clinical evidence. Use query parameters rather than string interpolation.

### Block 3 — API and orchestration (3 hours)

Implement server-side services and API routes for:

- [ ] `GET /api/patients`
- [ ] `GET /api/patients/[id]`
- [ ] `GET /api/patients/[id]/prescriptions`
- [ ] `POST /api/prescriptions`
- [ ] `PATCH /api/prescriptions/[id]` or a dedicated discontinuation endpoint
- [ ] `POST /api/patients/[id]/analyze-risk`
- [ ] `GET /api/alerts` for authorized users

Use the Next.js Route Handler conventions for your chosen framework version.

#### Risk-analysis service flow

1. Validate the requested patient ID.
2. Fetch the patient's active medications from PostgreSQL.
3. Map them to stable graph drug IDs.
4. Run direct pairwise interaction lookup.
5. Run bounded graph traversal at the chosen depths.
6. Deduplicate and classify returned paths.
7. Preserve source and evidence information.
8. Save an analysis/audit record and any appropriate alert records.
9. Return structured results to the client.

#### Cross-database consistency

Do not claim PostgreSQL and Neo4j participate in one ordinary ACID transaction.

Recommended four-day implementation:
- PostgreSQL transaction validates and saves the prescription plus an analysis-request/audit record.
- After commit, the backend runs Neo4j traversal.
- The backend persists the analysis outcome and status in PostgreSQL.
- Failures are recorded and can be retried.

If a full outbox worker is too much for the time available, implement a simpler explicit API workflow with a recorded `pending`, `completed`, or `failed` analysis status and document the limitation.

### Day 2 exit gate

- [ ] A test patient with known medication IDs can be analyzed by the API.
- [ ] API results include pathway steps and provenance.
- [ ] Core SQL examples execute.
- [ ] At least four advanced DB concepts are implemented and demonstrable.
- [ ] Invalid inputs are rejected.
- [ ] Secrets are not hard-coded.

---

# DAY 3 — Build the working Next.js interface and secure the workflow

## Day 3 objective

The project must be usable in the browser. Focus on four functional screens rather than extensive visual polish.

### Block 1 — Authentication and roles (1–2 hours)

Implement:
- [ ] Login/logout.
- [ ] Password hashing.
- [ ] Doctor role.
- [ ] Admin role.
- [ ] Server-side role checks on protected API routes.
- [ ] Access-denied behavior for unauthorized operations.
- [ ] Environment-variable configuration.
- [ ] No plaintext passwords or committed secrets.

A role field in a database is not enough: enforce role permissions in the server-side API and database operations. Avoid using client-side UI visibility as the only security measure.

### Block 2 — Doctor dashboard and patient pages (2–3 hours)

Build:
- [ ] Patient search/list.
- [ ] Patient detail view.
- [ ] Active medication list.
- [ ] Conditions list.
- [ ] Add/update/discontinue prescription form.
- [ ] Clear validation messages.
- [ ] Loading, empty and error states.

Use synthetic patients only. Do not use real identifiable patient information.

### Block 3 — Risk results interface (2 hours)

Build:
- [ ] Analyze Risk button.
- [ ] Summary of direct interactions and candidate indirect pathways.
- [ ] Risk/evidence category.
- [ ] Hop count.
- [ ] Expandable pathway explanation.
- [ ] Source/provenance display.
- [ ] Clear label when a pathway is uncorroborated.
- [ ] Audit/analysis timestamp and status.

Do not assign arbitrary clinical severity scores just to make the UI look complete. Use source-supported severity where available and label any project-specific ranking as a heuristic.

### Block 4 — Admin view and integration tests (1–2 hours)

Build:
- [ ] Alert/audit list.
- [ ] Basic user management or permitted data-management view.
- [ ] Data import/graph status if available.
- [ ] Unauthorized-access tests.
- [ ] Prescription constraint tests.
- [ ] End-to-end test: login → select patient → add/view medication → analyze → inspect explanation.

### Day 3 exit gate

A teammate or evaluator should be able to run the application and complete the main workflow without editing the database manually.

---

# DAY 4 — Experiments, bug fixing, documentation and demo

## Day 4 objective

Turn the working prototype into a reproducible, testable submission. Do not add major features on the final day unless all exit criteria already pass.

### Block 1 — Functional and integrity testing (2 hours)

Test at least the following:

| Test | Expected behavior |
|---|---|
| Valid patient lookup | Patient and medications appear |
| Unknown patient ID | Safe not-found response |
| Invalid prescription FK | Database rejects insert |
| Non-positive dosage | Database rejects insert |
| Duplicate active prescription | Rejected according to schema rules |
| Valid prescription | Persisted successfully |
| Failed transaction | No partial relational update |
| Patient with one medication | No cross-drug pair returned |
| Patient with multiple medications | Direct and graph checks run |
| No graph pathway | Empty result, not an application crash |
| Missing evidence | Result is marked accordingly |
| Doctor accesses Admin-only route | Denied |
| Unauthenticated API request | Denied |
| Database unavailable | Useful error; no secret leakage |

Add more tests for any edge cases you find.

### Block 2 — Required experiments (2–3 hours)

#### Experiment 1: Pairwise vs. graph coverage
For the same synthetic patient set, record:
- Number of direct documented interaction pairs.
- Number of additional candidate paths at 2 and 3 hops.
- Number supported by documented source mechanisms.
- Number uncorroborated.

Do not claim additional paths are true interactions merely because the graph returns them.

#### Experiment 2: Depth sensitivity
Compare 1-hop, 2-hop and 3-hop traversal:
- Number of candidate paths
- Evidence/corroboration category
- Query latency

#### Experiment 3: Performance
The pitch proposes 1K, 10K, 50K and 100K graph nodes and medication lists of 2–8 drugs. If time permits, benchmark these sizes. If the full scale cannot be generated and validated in four days, report the actual sizes tested and label the larger targets as future work.

For fair measurements:
- Run repeated trials.
- Record dataset size, medication count, query type, indexes, and machine/environment.
- Report median latency and optionally p95.
- Compare equivalent tasks.
- Record raw output in CSV or JSON.
- Do not fabricate or extrapolate results as if measured.

### Block 3 — Documentation (1–2 hours)

README must contain:
1. Project overview and problem statement
2. Objectives and scope
3. Features and known limitations
4. Architecture diagram
5. ER diagram and relational schema
6. Graph model and relationship descriptions
7. Database technology justification
8. Setup prerequisites
9. Environment-variable setup
10. Database creation/import instructions
11. How to run the Next.js application
12. Important SQL and Cypher queries
13. Advanced DB concepts demonstrated
14. API endpoints
15. Authentication and role behavior
16. Test cases and results
17. Experiment methodology and actual measurements
18. Screenshots
19. Team member contributions
20. Conclusion and future enhancements

Include the relevant documentation artifacts:
- [ ] ER diagram
- [ ] Relational schema/data dictionary
- [ ] Graph schema
- [ ] Architecture diagram
- [ ] Screenshots
- [ ] Test report
- [ ] Experiment outputs
- [ ] Setup instructions

### Block 4 — Clean setup and demo rehearsal (1–2 hours)

- [ ] Clone the repository into a fresh folder or use a clean environment.
- [ ] Follow README instructions exactly.
- [ ] Create PostgreSQL from scripts.
- [ ] Create/import Neo4j from scripts.
- [ ] Run seed data and start the app.
- [ ] Log in as Doctor and Admin.
- [ ] Demonstrate the core risk-analysis path.
- [ ] Demonstrate at least one constraint failure and one advanced DB concept.
- [ ] Show real experimental results.
- [ ] Verify Git history shows both members' meaningful contributions.
- [ ] Remove secrets, unnecessary files and restricted datasets from Git.
- [ ] Tag a stable submission commit.

### Day 4 exit gate

The submission is ready only when another person can follow the setup instructions, start the application, reproduce the database state, and run the main workflow.

---

## 6. Team responsibilities across the four days

Both members must contribute to both database and application development. Split ownership to avoid duplicated effort, but pair-review the critical integration points.

| Workstream | Member A — primary owner | Member B — primary owner |
|---|---|---|
| Data | Data inspection, synthetic patients, provenance | Graph data mapping, import verification |
| PostgreSQL | Schema, constraints, transaction design | Queries, functions, views, triggers and test cases |
| Neo4j | Review model and evidence semantics | Import scripts, indexes, traversal queries |
| API | Patient/prescription routes | Risk-analysis service and results contract |
| Frontend | Patient and prescription UI | Risk results and Admin UI |
| Security | Auth integration review | Role enforcement and access tests |
| Experiments | Coverage and depth analysis | Performance scripts and measurement report |
| Finalization | README/schema/SQL explanation | README/graph/experiment explanation |

**Daily coordination:** agree on API request/response formats before implementation; merge tested code at least twice a day; keep `main` runnable. Both members should understand the full architecture and be prepared to explain their own work during the viva.

---

## 7. Critical implementation details

### A. Do not use a generic graph path as the final clinical rule

A query like `(Drug)-[*1..3]-(Drug)` is useful for a first test but can return arbitrary paths. Restrict the allowed relationship sequences and direction according to the documented source semantics. Explain each result from its actual evidence.

### B. Avoid overclaiming what FAERS establishes

FAERS records adverse-event reports. A reported drug/event association is not proof of causation. Store the provenance and describe these as reported associations or signals, not established causal pathways.

### C. Avoid false atomicity across PostgreSQL and Neo4j

Use PostgreSQL transactions for relational changes. Coordinate graph analysis through the backend, record status, and handle failures/retries. A PostgreSQL transaction alone does not atomically commit a remote Neo4j operation.

### D. Keep security simple but real

- Use password hashes.
- Validate inputs server-side.
- Parameterize SQL and Cypher.
- Enforce roles on protected endpoints.
- Store secrets in environment variables.
- Never commit credentials.
- Use synthetic data only.
- Return safe errors without exposing connection strings or secrets.

### E. Keep the scope achievable

Cut in this order if time runs short:
1. Extra UI polish and animations.
2. Large dataset targets beyond the verified prototype.
3. Optional expert review.
4. Nonessential admin features.

Do **not** cut:
- Relational and graph database integration.
- Core bounded pathway traversal.
- Data integrity constraints.
- Required SQL/advanced DB demonstrations.
- Two-role authentication/authorization.
- Reproducible documentation and a working demo.

---

## 8. Final submission checklist

### Database design — 5 marks
- [ ] ER diagram
- [ ] Relational schema with keys/relationships/constraints
- [ ] Documented technology justification

### Database creation — 9 marks
- [ ] PostgreSQL DDL and constraints
- [ ] Neo4j schema/import
- [ ] Graph/NoSQL functionality
- [ ] Reproducible creation scripts

### SQL operations and queries — 8 marks
- [ ] INSERT, SELECT, UPDATE, DELETE
- [ ] Joins and aggregate queries
- [ ] Nested and correlated queries
- [ ] CTE and appropriate recursive query
- [ ] Query results documented

### Advanced DB concepts — 13 marks
- [ ] Functions/procedures
- [ ] Trigger
- [ ] Transactions and rollback
- [ ] Indexes
- [ ] CTEs
- [ ] Graph traversal and meaningful NoSQL feature
- [ ] Demonstrable test evidence

### Web application and integration — 5 marks
- [ ] Next.js interface
- [ ] Backend/API integration
- [ ] PostgreSQL and Neo4j used in the workflow
- [ ] Main workflow runs end to end

### Authentication and authorization — 4 marks
- [ ] Authentication
- [ ] At least two roles
- [ ] Server-side access checks
- [ ] Password hashing and environment variables

### Documentation, Git, demo, testing and originality — 6 marks
- [ ] README
- [ ] Architecture and schema documentation
- [ ] Screenshots
- [ ] Test report
- [ ] Measured experiments
- [ ] Individual Git contributions
- [ ] Demo script
- [ ] Honest limitations and future work

---

## 9. Suggested final demo script (5–7 minutes)

1. **Problem and architecture (45 seconds):** Explain why the project combines relational records with graph traversal.
2. **Database design (60 seconds):** Show ER diagram, constraints, and graph schema.
3. **Relational integrity (45 seconds):** Show a valid insert and an invalid dosage or foreign-key insert being rejected.
4. **Main application flow (90 seconds):** Log in as Doctor, open a synthetic patient, view medications, and run Analyze Risk.
5. **Explainable pathway (60 seconds):** Expand a returned path and show its source/evidence metadata and hop count.
6. **Advanced concepts (45 seconds):** Demonstrate a trigger/function, transaction rollback, index/query plan, or CTE.
7. **Experiments and limits (60 seconds):** Show actual pairwise-vs-graph, depth and performance results. Explain that synthetic data validates the system, not clinical outcomes.
8. **Roles and contribution (30 seconds):** Show Doctor/Admin separation and explain each member's contribution.

Rehearse with the same seed dataset and accounts that will be used in the final demonstration.

---

## 10. The rule for all four days

**Get one honest end-to-end workflow running as early as possible, then add rubric coverage around it.**

The most important result is not the number of files, pages, drugs, or graph nodes. It is a reproducible system where the relational data is valid, the graph paths are grounded in documented relationships, the explanation is traceable, the advanced DB concepts work, and the measurements are real.
