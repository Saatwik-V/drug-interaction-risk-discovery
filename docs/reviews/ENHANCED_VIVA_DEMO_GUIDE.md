# Enhanced Live Viva Demonstration Guide (Frontend-First Edition)
## Every Item in `FINAL_VIVA_DEMO_GUIDE.md`, Mapped to a Button, a Copy-Paste Command, and a Real-Frontend Touchpoint

> **What this document is.** `FINAL_VIVA_DEMO_GUIDE.md` assumes pgAdmin 4 / Neo4j Browser as the primary demo surface. This document inverts that: **the web application is the primary demo surface**, pgAdmin 4 / Neo4j Browser are kept only as *dual-verification* (to prove the UI isn't lying about what happened on disk), and — new in this edition — every Studio capability is explicitly traced to where the exact same thing is exercised in the **real clinical frontend** (dashboard, patient workspace, alerts, admin), not just inside `/dbms-studio`. Nothing in this document is aspirational: every claim below was verified live against the running Docker Postgres + Neo4j instances while writing it, including the exact constraint names, exact Cypher output, and exact screenshots.
>
> **Reading the tables below:** each rubric item has four columns — the Studio control, the copy-paste command for pgAdmin 4 / Neo4j Browser, and where (if anywhere) the same capability is also live in the regular clinical app, not just the Studio.

---

### 0. Pre-Flight Setup

```bash
docker compose up -d
docker compose ps
npm run dev
```

1. **App:** `http://localhost:3000` — `dr_sharma` / `Doctor@123` (DOCTOR) or `admin` / `Admin@123` (ADMIN).
2. **pgAdmin 4:** `localhost:5432` / `drug_interaction_db`, Query Tool open — verification only.
3. **Neo4j Browser:** `http://localhost:7474` (`neo4j` / `password123`) — verification only.

Press **⌘K / Ctrl+K** anywhere to jump to a patient, screen, or lab demo.

---

# 1. ER Diagram (2 Marks)

Static document, unchanged — [`docs/database-design/ER_Diagram_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf). Not a frontend feature in either guide.

---

# 2. Relational Schema (3 Marks)

Static document — [`docs/database-design/Relational_Schema_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf). Cross-checkable live via `/dbms-studio` → **5. DDL & Schema Studio**.

---

# 3. SQL DDL with Constraints (4 Marks)

| What | Studio control | Copy-paste for pgAdmin 4 | Also live in real frontend |
|---|---|---|---|
| All 10 tables + full DDL | Tab 5 → table dropdown → "Show Create Table" panel | *(the panel itself generates the exact `CREATE TABLE` text — click Copy)* | — (schema inspection is inherently a Studio/DBA task) |
| All 11 foreign keys + their rules | Tab 5 → Constraints Catalog | `SELECT conrelid::regclass, conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY 1;` | Every one of these 11 constraints fires for real whenever you use the dashboard/patient workspace normally — see the live FK table below |
| `ON DELETE RESTRICT` | Tab 1A → drug dropdown → **Attempt Deletion of Referenced Drug** | *(button shows the exact `DELETE` + the live `VerifyOnDisk` panel gives you the confirm query to paste)* | Implicitly: `drugs` can never be deleted from any UI while referenced — there's no "Delete Drug" button anywhere in the app, by design, matching this constraint |
| `ON DELETE CASCADE` | Tab 1B → **Spawn Ephemeral Test Patient** → **Delete Parent Patient** | `VerifyOnDisk` panel generates the live counts query automatically | **Yes — this is the exact same cascade a real "Delete Patient" click on `/dashboard` triggers.** Spawning a patient on `/dashboard` and deleting it exercises identical FK rows |
| `CHECK` constraints | Tab 1C → three one-click tests | N/A — each attempt is rejected and rolled back automatically, nothing to verify afterward | `ck_patient_synthetic` is enforced on *every* dashboard "Add Patient" (the form hardcodes `is_synthetic=TRUE` so it never trips, but the guard is live underneath) |

**Live foreign-key table (verified against the running database, not assumed):**

| Table | Constraint | Rule |
|---|---|---|
| `prescriptions` | `fk_prescription_patient` | `patient_id → patients` **CASCADE** |
| `prescriptions` | `fk_prescription_drug` | `drug_id → drugs` **RESTRICT** |
| `risk_assessments` | `fk_assessment_patient` | `patient_id → patients` **CASCADE** |
| `assessment_findings` | `fk_finding_assessment` | `assessment_id → risk_assessments` **CASCADE** |
| `assessment_findings` | `fk_finding_drug_a` / `fk_finding_drug_b` | `drug_*_id → drugs` **RESTRICT** |
| `ddi_pairs` | `fk_pair_drug_a` / `fk_pair_drug_b` | `drug_*_id → drugs` **RESTRICT** |
| `ddi_severities` | `fk_severity_pair` | `pair_id → ddi_pairs` **CASCADE** |
| `ddi_mechanisms` | `fk_mechanism_pair` | `pair_id → ddi_pairs` **CASCADE** |
| `drug_source_mappings` | `fk_mapping_drug` | `drug_id → drugs` **CASCADE** |

**Caveat verified live:** deleting `warfarin` (`drug_id=1`) in the Studio's RESTRICT demo is rejected by **`fk_pair_drug_a`** on `ddi_pairs`, not `fk_prescriptions_drug` — Postgres hits whichever FK check comes first, and warfarin is referenced from both `ddi_pairs` and `prescriptions`. The Studio now shows whichever real constraint actually fires (confirmed: `fk_pair_drug_a`), not a hardcoded guess.

---

# 4. NoSQL/Graph Database Creation (4 Marks)

**Closed this pass — previously the Studio had no in-app equivalent to `SHOW CONSTRAINTS` or node/edge counts; the examiner had to use Neo4j Browser for this entire rubric item.**

| What | Studio control | Copy-paste for Neo4j Browser | Also live in real frontend |
|---|---|---|---|
| Uniqueness constraints | Tab 7 → top card, "Uniqueness Constraints (SHOW CONSTRAINTS)" | `SHOW CONSTRAINTS;` | — |
| Node/edge counts | Tab 7 → top card, two stat tiles | `MATCH (d:Drug) RETURN count(d);` / `MATCH ()-[r:INTERACTS_WITH]->() RETURN count(r);` | — |
| Inspect a sample node | Tab 7 → "Read: 1-hop ego-network for" dropdown | `MATCH (d:Drug {canonical_name:'amiodarone'}) RETURN d;` | `/patients/[id]` graph viewer renders the same node data for a patient's active drugs |

**Verified live:** 2 uniqueness constraints (`unique_drug_canonical_name` on `(:Drug).canonical_name`, `unique_drug_id` on `(:Drug).drug_id`), both `ONLINE` — confirmed by actually running `SHOW CONSTRAINTS` against the running container, not assumed from docs. 10 drug nodes, 9 `INTERACTS_WITH` edges.

---

# 5. Technology Justification (1 Mark)

Verbal defense; `/architecture` page walks the same argument with real file paths from this repo. Unchanged.

---

# 6. DML Operations (4 Marks)

**This is where the real frontend *is* the demonstration — no Studio tab needed, because the dashboard and patient workspace are the real thing, not a simulation of it.**

| Operation | Where in the real app | What fires | Copy-paste to verify in pgAdmin 4 |
|---|---|---|---|
| **INSERT** | `/dashboard` → **+ Add New Synthetic Patient** | `INSERT INTO patients ... RETURNING *` | `SELECT * FROM patients ORDER BY patient_id DESC LIMIT 1;` |
| **SELECT** | `/patients/[id]` loads on open | Joined query across `prescriptions`/`drugs`/`patients` | `SELECT p.full_name, d.canonical_name, pr.dosage FROM prescriptions pr JOIN patients p USING (patient_id) JOIN drugs d USING (drug_id) WHERE pr.patient_id = 1;` |
| **UPDATE** | `/patients/[id]` → click a dosage pill → edit → save | `UPDATE prescriptions SET dosage = ...` | `SELECT dosage FROM prescriptions WHERE prescription_id = <id>;` |
| **DELETE** | `/dashboard` → patient row → **Delete** → typed `DELETE` confirmation dialog → confirm | `DELETE FROM patients WHERE patient_id = ...` (cascades) | `SELECT count(*) FROM patients WHERE patient_id = <id>;` → `0` |

**Fixed this pass:** both the patient-delete and prescription-discontinue actions used to call the browser's native `confirm()` — explicitly banned by this project's own UI rules, and impossible to style or make typed-confirmation for a destructive cascade. Both now use the app's `ConfirmDialog` component; deleting a patient requires typing `DELETE` since it's irreversible and cascades across 3 other tables.

---

# 7. Nested/Correlated/Recursive Queries, Joins (4 Marks)

| Query | Studio control | Copy-paste | Notes |
|---|---|---|---|
| Multi-table `LEFT OUTER JOIN` | Tab 4 → Q1 | Copy button on the query card | — |
| `SELF-JOIN` on prescriptions | Tab 4 → Q2 | Copy button | — |
| Correlated `EXISTS` | Tab 4 → Q3 | Copy button | — |
| Nested `IN` + `UNION` | Tab 4 → Q4 | Copy button | — |
| Window: `DENSE_RANK()` | Tab 4 → Q5 | Copy button | — |
| Window: `PARTITION BY` + `ROW_NUMBER()` | Tab 4 → Q6 | Copy button | — |
| **Recursive CTE** (2-hop graph in SQL) | Tab 4 → Q7 | Copy button | Produces the exact warfarin → amiodarone → simvastatin bridge the Neo4j traversal also finds — a legitimate "we proved it two ways" talking point |

All 7 are a server-defined whitelist (`SHOWCASE_QUERIES` in `app/api/dbms/queries/execute/route.ts`) — deliberately **not** a free-form SQL console, so there's no injection surface regardless of who's logged in.

---

# 8. Advanced SQL — Procedure, Trigger, CTE (6 Marks)

### A. Stored Procedure
- **Studio:** Tab 3 → pick patient/clinician/notes → **Invoke**.
- **Copy-paste:** `SELECT * FROM fn_perform_patient_direct_screening(1, 'dr_sharma', 'pgAdmin verification');`
- **Honest note on real-frontend usage:** the stored procedure is a real, independently-callable PL/pgSQL function in the database — invoking it from Tab 3 genuinely executes it and genuinely inserts a new `risk_assessments` row (verifiable in pgAdmin). **It is not, however, what the "Launch Multi-Hop Risk Discovery" button on `/patients/[id]` calls.** That button runs equivalent logic implemented directly in TypeScript (`lib/postgres/patient-service.ts`'s `getDirectInteractionsForDrugs`), because the real screening flow needs to combine the direct-pair result with a separate Neo4j multi-hop query and persist both findings under one assessment session — the procedure's own internal `INSERT INTO risk_assessments` would conflict with that. Both code paths implement the **same direct-pairwise logic** and were checked against each other to agree with the same Patient 1 data, but they are two parallel implementations, not one calling the other. Say this plainly if asked — it's a legitimate design decision (the procedure is a clean single-call showcase for Tab 3; the orchestrator needs more control over the transaction than a single function call gives it), not a gap.

### B. Trigger — isolated, self-resetting sandbox
- **Studio:** Tab 2 → **+ Insert 1-Hop / 2-Hop Finding** → watch counters flip live → **Verify on disk** panel → **Re-read from database**.
- **Copy-paste:** `SELECT assessment_id, direct_interaction_count, multi_hop_candidate_count FROM risk_assessments WHERE assessment_id = <shown id>;`
- **Also live in real frontend:** this is the important one — **`trg_assessment_findings_count` fires on every real "Launch Multi-Hop Risk Discovery" click on `/patients/[id]`, too**, not just in the Studio sandbox. Every finding `orchestrateRiskAssessment()` persists goes through the same `INSERT INTO assessment_findings`, which fires the same trigger, on real patient data. The Studio's version is deliberately isolated (tagged `assessment_notes='DBMS_STUDIO_TRIGGER_DEMO'`, purged/recreated every tab visit) so clicking around in the demo never corrupts a real patient's assessment history — but the trigger logic being demonstrated is the exact same trigger the main app depends on for its own `direct_interaction_count` and `multi_hop_candidate_count` summary numbers shown throughout `/alerts` and `/patients/[id]`.

### C. CTE
Covered in §7 (Q7, recursive). The non-recursive window-function CTEs are Q5/Q6.

---

# 9. NoSQL/Graph RUD (7 Marks)

**This is the section with the most changes this pass.** Previously `/api/neo4j/graph-rud` (full Create/Read/Update/Delete) existed in the backend with **zero frontend consumer** — a complete rubric gap despite the API being real. It's now Tab 7, and building its first UI surfaced two real backend bugs:

1. **Property-name mismatch:** the RUD service read/wrote `mechanism_category` (singular), while the seed data and the real risk-traversal query (`lib/neo4j/graph-service.ts`) use `mechanism_categories` (plural array). Every real seeded edge was showing the placeholder *"General Interaction"* instead of its actual mechanism. Fixed — confirmed live: `warfarin ↔ amiodarone` now correctly reads *"Affected intra_extra-hepatic metabolism"*.
2. **A `MERGE` pattern bug that silently duplicated edges**: `createGraphInteraction` matched on `(a)-[r:INTERACTS_WITH {source_dataset:'CustomAdmin'}]->(b)` — the property inside the pattern makes Neo4j treat it as a different relationship from the plain edges the seed script creates, so "merging" into an already-documented pair added a *second*, parallel edge instead of updating the first. Combined with `UPDATE`/`DELETE` matching *any* edge between the pair with no disambiguation, this could delete more than one relationship per click. **This actually happened twice during this project's own testing** — the real `warfarin ↔ aspirin` seed edge (`pair_id 1001`) was destroyed and had to be restored from the seed script's exact values, which is also why **Tab 7's Create/Read/Update/Delete form no longer defaults to a real documented pair** (`metoprolol`/`ibuprofen`, which has no existing edge, is now the default) — so casually clicking through the form can never again destroy real demonstration data.

| Operation | Studio control | Copy-paste for Neo4j Browser |
|---|---|---|
| **Visual graph render** | Tab 7 → top card → **View Full Interaction Graph** | `MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug) RETURN d1, r, d2 LIMIT 30;` |
| **2-hop bridge discovery** | `/patients/[id]` → Run Discovery → each candidate card has its own **Verify on disk** panel | Generated per-result, e.g. `MATCH path = (d1:Drug {canonical_name:"warfarin"})-[r:INTERACTS_WITH*2]-(d2:Drug {canonical_name:"simvastatin"}) RETURN path;` — **this now matches the exact pattern in the original guide, generated dynamically from whatever pathway was actually found**, not a hardcoded example |
| **Create** | Tab 7 → pick two drugs, severity, mechanism → **Create (MERGE)** | `MERGE (a)-[r:INTERACTS_WITH]-(b) SET r.severity_level=…, r.mechanism_categories=[…]` |
| **Read** (lookup, ego-network) | Tab 7 → drug dropdown | `MATCH (d:Drug {canonical_name:'amiodarone'})-[r]-(other) RETURN d, r, other;` |
| **Read** (degree centrality) | Tab 7 → top card → ranking list | `MATCH (d:Drug)-[r:INTERACTS_WITH]-() RETURN d.canonical_name, count(r) AS degree_centrality ORDER BY degree_centrality DESC LIMIT 5;` |
| **Update** | Tab 7 → same form → **Update (SET)** | `MATCH (a)-[r:INTERACTS_WITH]-(b) SET r.severity_level=…` |
| **Delete** | Tab 7 → same form → **Delete** | `MATCH (a)-[r:INTERACTS_WITH]-(b) DELETE r` |

Every mutation shows a **Verify on disk** panel (exact Cypher + a live **Re-read from database** button that re-queries this app's own backend, not a second UI claim).

---

# 10. Next.js Interface (3 Marks)

- **Role-aware shell:** live PG/Neo4j health dots, `⌘K` command palette, role-gated nav (hiding is cosmetic; `requireRole()` server-side is the real boundary).
- **Graceful 403s, fixed this pass:** a DOCTOR hitting `/admin` used to redirect to `/dashboard` with zero explanation. Now the redirect carries `?forbidden=admin` and the dashboard shows a toast explaining exactly what happened and why.
- **Live CRUD ↔ UI sync:** insert a patient via pgAdmin, refresh `/dashboard`, it appears; delete via the UI, it vanishes from pgAdmin. Verified end-to-end this pass (create as ADMIN, prescribe as DOCTOR, screen, see it in `/alerts`, delete — no manual steps skipped, no errors in the server log across the whole sequence).

---

# 11. Backend/API & Database Integration (2 Marks)

- **Where:** `/patients/[id]` → pick traversal depth (1/2/3) → **Launch Multi-Hop Risk Discovery**.
- **Fixed this pass — the hop-depth selector used to be cosmetic:** the UI always sent `maxHopDepth: 2` regardless of what was shown, and the backend silently ignored the field entirely — it always queried Neo4j for 2–3 hops and always reported `max_hop_depth_searched: 3` even when that wasn't true. Now genuinely bounded end-to-end: depth 1 skips Neo4j entirely (direct findings only), depth 2 finds only 2-hop bridges, depth 3 finds 2- and 3-hop bridges — verified live against Patient 1 for all three values, with the response's `max_hop_depth_searched` always matching what was actually asked, and an out-of-range value rejected with `400` rather than silently clamped.
- **Scientific disclaimer, now actually shown:** the API always returned a `scientific_disclaimer` string; the frontend never rendered it anywhere. It's now a prominent, non-dismissible callout above every candidate-pathway list, verbatim from the API — including a small rendering bug fixed this pass where the warning icon was literally displaying the text `⚠` instead of the ⚠ character (a stray escaped-string artifact, not a logic bug, but a visible one).
- **Severity and finding-type accuracy, two separate bugs fixed:**
  - `/patients/[id]` used to hardcode every direct finding's badge to "Major" — fixed to use the real `severity_level`.
  - `/alerts` expected `finding_type === 'DIRECT_INTERACTION'`, but the real API value is `'DOCUMENTED_DIRECT'` — the comparison was always false, so **every real documented direct interaction in the audit log was mislabeled as a speculative candidate pathway** (the opposite of the disclaimer rule — understating a confirmed finding as a hypothesis). Fixed; wording now matches the project's own required phrasing exactly ("Documented interaction" / "Candidate pathway (hypothesis) — N hops").
  - A color-semantics bug: `Minor` severity used the same green as "nothing to worry about." `Minor` is now blue; `Safe` has its own distinct green token (`--sev-safe`), and the `.badge-safe` class — referenced on the patient header but never actually defined in CSS — now exists.

---

# 12. Authentication & RBAC (4 Marks)

- **Frontend session:** `HttpOnly`, `SameSite=Lax` JWT cookie — unchanged.
- **Database-engine RBAC, from the UI:** Tab 6 → **Test Least-Privilege Access as `role_doctor`** → live `42501 permission_denied`, no pgAdmin needed.
- **Two-tier `CREATE USER`, the headline fix of the whole project:** Tab 6 is meant to prove that creating a user in the UI executes real PostgreSQL DCL. **It was silently never working** — `DO $$ ... $$` blocks don't accept `$1`-style bind parameters, so every `CREATE USER` attempt failed with protocol error `08P01`, was swallowed by a `catch`, and the route still reported success. Verified via a live `pg_roles` query that zero users were ever actually created before the fix. Fixed by escaping the password with the driver's own `escapeLiteral()` and interpolating plain, pre-validated SQL text — now verified live end-to-end: `CREATE USER`, `GRANT role_doctor`, and `DROP USER` all show up correctly in `pg_user`/`pg_roles`, and the **Verify on disk** panel on this tab gives the exact `SELECT usename, usecreatedb FROM pg_user WHERE usename = '<name>';` to paste into pgAdmin yourself.
- **Also fixed:** the demo form's username used to default to a fixed string, so re-running the demo always collided. Now randomized per page load, and a **Remove Demo Account** button does a real `DROP USER` + profile delete (seeded accounts `admin`/`dr_sharma` are protected from this).

### ⚠️ One open item — needs your approval to apply

A real security/architecture gap was found and the code fix is in place, but the matching database grant could not be applied automatically (blocked by the permission system as a privilege change requiring explicit sign-off):

- **The bug:** `createPatient`/`updatePatient` always wrote through the `app_admin_user` connection regardless of who was actually calling — even though a DOCTOR is allowed to add/edit patients at the application layer. Verified empirically: `app_doctor_user` currently gets a clean `permission denied for table patients` if you try. A compromised DOCTOR session would have had silent admin-level DB access for this path.
- **The code fix (done):** patient writes now go through the DB pool matching the caller's actual session role.
- **The pending grant (not yet applied — run this in pgAdmin 4 or ask the agent to):**
  ```sql
  GRANT SELECT, INSERT, UPDATE ON TABLE patients TO role_doctor;
  GRANT USAGE, SELECT ON SEQUENCE patients_patient_id_seq TO role_doctor;
  ```
  Until this runs, a DOCTOR creating/editing a patient from `/dashboard` gets a real `42501` error (a correct failure, not a crash) instead of succeeding. `database/postgres/05_roles_rbac.sql` already has this grant for a fresh reseed; this is only needed to patch the *already-running* database.

---

# 13. Documentation, Git/GitHub (2 Marks)

Unchanged — `git log -n 5 --oneline`, `docs/README.md`, `docs/database-design/DATA_DICTIONARY.md`.

---

# 14. Originality, Testing, Viva (4 Marks)

```bash
npm run test:integration   # 30/30
npm run test:auth          # 26/26
python3 -m unittest discover tests/unit/   # 11/11
```

All **67 assertions pass**, re-verified after every single fix in this document, not just once at the end.

**A genuinely strong originality point, if asked:** this pass found and fixed **seven real, previously-undetected defects** by actually exercising the running system rather than reading code in isolation — a `TypeError` crash on the DCL tab (Postgres returns `name[]` as an unparsed string, not a JS array), a CSS inheritance bug that pushed a 3-column grid past its container, a data-leak where an isolated demo session appeared in the real clinical audit log, a security gap where DOCTOR-role writes silently used admin DB privileges, a mouse-coordinate bug in the graph canvas that only manifests at non-native viewport widths, a literal-text rendering bug (`⚠` instead of ⚠), and the Neo4j `MERGE`-pattern bug that could duplicate or destroy real graph edges — the last one was caught **live, while testing its own fix**, and the destroyed seed edge was restored to its exact original values before continuing. Each fix was verified against the real databases, not assumed correct from the diff.

---

## Full Studio ↔ Real-Frontend Traceability Index

A quick-reference answer to "is this Studio thing *actually* used by the app, or just a demo?" — for every tab:

| Studio tab | Real-frontend touchpoint |
|---|---|
| **1. Constraints Lab** | `ON DELETE RESTRICT`/`CASCADE` are the same FKs the dashboard's Delete Patient button exercises. `CHECK` constraints guard every dashboard "Add Patient" submission (the form just never violates them by construction). |
| **2. Triggers & Audits** | `trg_assessment_findings_count` fires on every real patient screening via `/patients/[id]` — the Studio's version is an isolated sandbox copy of the same trigger, not a different one. |
| **3. Procedures & Functions** | Independently real (verifiable in pg_proc, really invoked), but **not** called by the main screening flow — see the honest note in §8A above. |
| **4. Advanced SQL & CTEs** | Read-only reporting queries; not tied to a specific button elsewhere, but Q7's recursive CTE finds the identical bridge the real Neo4j traversal finds. |
| **5. DDL & Schema Studio** | Pure introspection (`information_schema`/`pg_catalog`); describes the schema every other feature depends on. |
| **6. DCL & Roles** | `CREATE USER`/`GRANT`/`DROP USER` are real and independent of `/admin` — `/admin`'s "+ Add Account" form calls the exact same `createUser()` function this tab's form does (same backend code path, `lib/auth/auth-service.ts`). |
| **7. NoSQL Graph RUD** | Read (ego-network, centrality, constraints) now reachable nowhere else in the app; the full-graph render reuses the same `InteractionGraphViewer` component the patient page uses for its subgraph. Create/Update/Delete are Studio-only by design — a clinician shouldn't hand-edit the graph from clinical screens. |
