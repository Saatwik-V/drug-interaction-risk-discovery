# Peer Reviewer & Teammate Final Acceptance Guide

**Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course:** PES University — Department of Computer Science & Engineering — DBMS Experiential Learning Level 3 (Aug–Dec 2026)  
**Target Audience:** Project Teammate / Human Independent Reviewer  
**Primary Contact:** Saatwik V (`saatwik455@gmail.com`)  
**Repository Branch:** `main` (Commit `084b7e1`)  

---

> [!CAUTION]
> ### STRICT REVIEWER DIRECTIVE: DO NOT EDIT THE CODEBASE DIRECTLY
> To maintain strict git hygiene, preserve Docker database volumes, and prevent merge conflicts before laboratory submission:
> 1. **DO NOT edit, commit, or push changes** to any file in this repository.
> 2. **DO NOT modify or regenerate** `ER_Diagram_Final.drawio` or `Relational_Schema_Final.drawio`.
> 3. **DO NOT execute destructive git commands** (`git reset --hard`, `git clean -f`, or force checkouts).
> 4. **Run, test, and inspect everything read-only**. If you identify any defects, typos, or discrepancies, record them in the **Reviewer Feedback Template** at the bottom of this document and report them to Saatwik for coordinated resolution.

---

## 1. What You Need to Review (End-to-End Checklist)

Please inspect each deliverable against the official **DBMS Level 3 Rubric (50 Marks)**:

### A. Conceptual ER Model & Relational Schema (5 Marks)
- [ ] [`docs/database-design/ER_Diagram_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.drawio) (Editable XML)
- [ ] [`docs/database-design/ER_Diagram_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.pdf) & [`ER_Diagram_Final.png`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.png) (Exported renders)
  - Verify Peter Chen notation (rectangles, diamonds, ellipses, double lines for total participation).
  - Verify `DDI_PAIR` is modeled as a distinct entity linked to `DRUG` via `Drug A` and `Drug B`.
  - Verify `FINDING_DRUG_A` and `FINDING_DRUG_B` connect to `DRUG`.
  - Verify `USER_ACCOUNT — PERFORMED_BY — RISK_ASSESSMENT` is drawn dashed as conceptual.
- [ ] [`docs/database-design/Relational_Schema_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.drawio) & [`Relational_Schema_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf)
  - Verify all 10 tables, underlined primary keys, and exactly 11 foreign-key connectors matching PostgreSQL DDL.
- [ ] [`docs/database-design/RELATIONAL_SCHEMA.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/RELATIONAL_SCHEMA.md) & [`ER_MODEL.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_MODEL.md)
  - Check written relational notation and `(min, max)` structural constraints.

### B. Normalization, Data Dictionary & Justification (9 Marks)
- [ ] [`docs/database-design/NORMALIZATION.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/NORMALIZATION.md)
  - Verify BCNF functional dependency proofs across all 10 tables.
  - Verify 4NF decomposition proof separating multi-valued `ddi_mechanisms` from `ddi_severities`.
  - Verify canonical ordering constraint proof: $\text{CHECK} \ (drug\_a\_id < drug\_b\_id)$.
- [ ] [`docs/database-design/DATA_DICTIONARY.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/DATA_DICTIONARY.md)
  - Verify catalog of 75 column attributes with data types and provenance tags.
- [ ] [`docs/database-design/TECHNOLOGY_JUSTIFICATION.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/TECHNOLOGY_JUSTIFICATION.md)
  - Review technical justification for dual-database architecture (PostgreSQL + Neo4j) and defense regarding vector databases.

### C. SQL Scripts, Stored Procedures & Triggers (21 Marks)
- [ ] [`database/postgres/01_schema.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/01_schema.sql) (10 tables with primary, foreign, unique, and check constraints)
- [ ] [`database/postgres/02_constraints_indexes.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/02_constraints_indexes.sql)
  - Stored function `fn_perform_patient_direct_screening()`.
  - Trigger `trg_assessment_findings_count` executing `fn_update_assessment_counts()` with `SECURITY DEFINER SET search_path = public, pg_temp`.
- [ ] [`database/postgres/04_required_queries.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/04_required_queries.sql)
  - Verify all 7 required SQL query categories (joins, correlated subqueries, window functions, recursive graph CTE).

### D. Graph Model & Cypher Traversals
- [ ] [`database/neo4j/01_constraints.cypher`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/neo4j/01_constraints.cypher) & [`03_queries.cypher`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/neo4j/03_queries.cypher)
  - Verify bounded 1-hop direct, 2-hop bridge, and 3-hop multi-path Cypher traversals.
  - Verify NoSQL CRUD demonstration on test compound.

### E. Authentication, RBAC & Full-Stack UI (9 Marks)
- [ ] [`database/postgres/05_roles_rbac.sql`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/database/postgres/05_roles_rbac.sql)
  - Verify database-level roles: `role_doctor` vs `role_admin`.
  - Verify `REVOKE ALL ON TABLE user_accounts FROM role_doctor`.
- [ ] Next.js UI Screens at `http://localhost:3000`:
  - Login view (`/login`), Doctor Dashboard (`/dashboard`), Patient Regimen & Screening (`/patients/1`), Alerts Audit Log (`/alerts`), Admin Console (`/admin` and `/admin/users`).

---

## 2. Environment Setup & How to Run the Code

### Prerequisites
Ensure your local machine has the following tools installed:
- **Docker Desktop** (running and healthy)
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher)

### Setup Instructions

1. **Pull Latest Changes:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify Environment Configuration:**
   Ensure `.env` exists (copy from `.env.example` if needed):
   ```bash
   cp -n .env.example .env
   ```

3. **Start Database Containers:**
   Launch PostgreSQL 16 and Neo4j 5 in the background:
   ```bash
   docker compose up -d
   ```
   Verify that both containers show `(healthy)`:
   ```bash
   docker compose ps
   ```

4. **Install Dependencies (if running fresh):**
   ```bash
   npm install
   ```

---

## 3. How to Execute Automated Verification Tests

Run the following non-destructive test commands in your terminal. All tests must pass with 100% success:

### Test 1: Authentication & PostgreSQL Database-Level RBAC
```bash
npm run test:auth
```
- **Expected Outcome:** `26 / 26 PASS`.
- **What it verifies:** Bcrypt credential verification, JWT token signing and tamper detection, Next.js route protection, and PostgreSQL engine privilege denial (`42501`) when `app_doctor_user` attempts to query `user_accounts` or delete patients.

### Test 2: Cross-Database Integration & Risk Discovery
```bash
npm run test:integration
```
- **Expected Outcome:** `30 / 30 PASS`.
- **What it verifies:** Patient registry retrieval, direct pairwise discovery in PostgreSQL, bounded multi-hop candidate bridge traversal in Neo4j (`Warfarin -> Amiodarone -> Simvastatin`), transactional persistence, and automated counter trigger updates.

### Test 3: Data Invariants & Provenance Guards
```bash
python3 -m unittest discover tests/unit/
```
- **Expected Outcome:** `11 / 11 PASS`.
- **What it verifies:** Canonical ordering constraints (`drug_a_id < drug_b_id`), zero synthetic data leaks, and mapping validity.

### Test 4: TypeScript Static Compilation & Next.js Production Build
```bash
npx tsc --noEmit
npm run build
```
- **Expected Outcome:** `0 errors` and clean static page generation across all 9 application routes.

---

## 4. How to Test the Web Application Locally

1. **Start the Development Server:**
   ```bash
   npm run dev
   ```
2. **Open Your Browser:** Navigate to `http://localhost:3000`.

### Smoke Test Flow A: Doctor Experience (Clinical Screening)
1. On the login screen, click the **"Doctor Demo (dr_sharma)"** quick-fill button, then click **Sign In**.
2. **Verify Dashboard:** Check that the greeting reads *"Welcome, Dr. Sharma | DOCTOR Role"* and patient cohort metrics are displayed.
3. **Screen Patient 1:**
   - Locate patient **Robert Vance** (`SYN-PAT-1001`) and click **"View & Screen Regimen"**.
   - Notice the 3 active medications: *Warfarin*, *Amiodarone*, *Simvastatin*.
   - Set Traversal Radius to **2 Hops** and click **"Run Graph Risk Discovery"**.
   - Verify that **2 Direct Documented Interactions** are shown (*Warfarin ↔ Amiodarone*, *Amiodarone ↔ Simvastatin*).
   - Verify that **1 Candidate Multi-Hop Pathway** is discovered (*Warfarin → Amiodarone → Simvastatin* with Amiodarone as the metabolic bridge).
   - Verify that the scientific disclaimer box is prominently displayed.
4. **Check Alerts Audit:**
   - Click **"Alerts Audit"** in the top navigation bar (`/alerts`).
   - Confirm that the newly created screening session appears in the persistent audit log with its findings.
5. **Verify Security Boundary:**
   - Manually type `http://localhost:3000/admin` in your browser URL bar.
   - Confirm that the middleware intercepts the request and redirects you back to `/dashboard` with an authorization notice.

### Smoke Test Flow B: Administrator Experience (User Management)
1. Click **"Sign Out"** in the top navigation bar.
2. Click the **"Admin Demo (admin)"** quick-fill button, then click **Sign In**.
3. Confirm access to `/admin` and navigate to `/admin/users`.
4. Inspect the registered system accounts (`dr_sharma`, `admin`) and observe the user creation form.

---

## 5. Reviewer Feedback Template

Please copy and fill out this review template, then send it to Saatwik via email or chat:

```markdown
### Peer Reviewer Feedback Report

- **Reviewer Name:** [Your Name]
- **Date of Review:** [Date]
- **Git Commit Tested:** 084b7e1

#### 1. Test Suite Execution Checklist
- [ ] `docker compose ps` shows both containers healthy
- [ ] `npm run test:auth` passed (26/26)
- [ ] `npm run test:integration` passed (30/30)
- [ ] `python3 -m unittest discover tests/unit/` passed (11/11)
- [ ] `npx tsc --noEmit` returned 0 errors
- [ ] `npm run build` compiled 9/9 routes cleanly

#### 2. Visual & Documentation Alignment Checklist
- [ ] `docs/database-design/ER_Diagram_Final.pdf` inspected and Chen notation confirmed
- [ ] `docs/database-design/Relational_Schema_Final.pdf` inspected and 11 FKs confirmed
- [ ] `docs/database-design/NORMALIZATION.md` reviewed (BCNF & 4NF proofs confirmed)
- [ ] `docs/database-design/DATA_DICTIONARY.md` reviewed (all 10 tables present)
- [ ] Web application smoke test completed at http://localhost:3000

#### 3. Observed Issues / Discrepancies (if any)
1. [Describe issue, file path, and recommended minimal fix, or write "None observed - All Good"]

#### 4. Final Human Acceptance Verdict
- [ ] APPROVED WITHOUT CHANGES (Ready for final lab submission)
- [ ] APPROVED WITH MINOR COMMENTS (Non-blocking documentation tweaks)
- [ ] NEEDS REVISION (Blocking defect identified - details listed above)
```
