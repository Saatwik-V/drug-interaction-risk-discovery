# Persistent Operating Instructions for AI Agents

> **Project operating rule:** The pitch is our overall vision, the four-day implementation plan is our current execution contract, and the official DBMS Level 3 rubric is our grading authority. Implement the smallest honest, reproducible end-to-end system that satisfies the rubric within the four-day plan. Do not expand scope merely because the pitch proposes additional capabilities.

---

## 1. Project Identity and Purpose

- **Project Title:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery
- **Course Context:** PES University — DBMS Experiential Learning Level 3 (August–December 2026)
- **Primary Goal:** Build a working, reproducible database-systems prototype that compares conventional pairwise drug-interaction checking with bounded graph traversal (direct, 2-hop, 3-hop) to explain potential interaction risks across a patient's medication list.
- **Core Technology Stack:**
  - **Relational Storage:** PostgreSQL for patients, doctors, prescriptions, conditions, and transactional audits.
  - **Graph Storage:** Neo4j for documented biomedical entities (drugs, targets/enzymes, pathways, adverse events) and relationship traversal.
  - **Application & API:** Next.js (TypeScript) Route Handlers orchestrating relational queries, Cypher traversals, input validation, and role-based access control.

---

## 2. Core Source Documents and Authority Hierarchy

All future coding agents must recognize the distinct authority and purpose of the three project documents:

| Document | Location | Role in Decision Making |
|---|---|---|
| **DBMS Level 3 Rubric** | [`docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf) | **Grading Authority:** Authoritative source for all course assessment criteria (50 marks total). Every feature must trace back to satisfying these requirements. |
| **Four-Day Plan** | [`docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md) | **Execution Contract:** The primary operational reference. Governs immediate implementation priorities, daily exit gates, vertical slice boundaries, and deliverables. |
| **Project Pitch** | [`docs/project-plan/PROJECT_PITCH.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/PROJECT_PITCH.pdf) | **Conceptual Vision:** High-level problem context, dual-database justification, biomedical domain modeling ideas, and long-term research ambitions. |

### Conflict Resolution Order

When deciding what to build, how to prioritize, or how to resolve ambiguities, apply this strict hierarchy:
1. **Official Rubric:** Does this satisfy an evaluated rubric requirement?
2. **Four-Day Plan:** Did we commit to this within our four-day vertical-slice scope?
3. **Project Pitch:** What is the conceptual motivation or long-term vision?

If a requirement appears in the pitch but the four-day plan explicitly scales it down (e.g., smaller sample datasets vs. full multi-gigabyte dumps), **follow the four-day plan**. Do not expand scope unless core deliverables are completed, tested, and rubric-compliant. If an unresolved conflict arises, explicitly flag it for user review.

---

## 3. Current Phase Status

- **Active Phase:** Repository setup, documentation indexing, and project-context initialization.
- **Pending Phases:** Dataset acquisition, licensing verification, PostgreSQL schema creation, Neo4j graph population, API routing, and web UI development have **not yet been started**.
- **Scope Discipline:** Agents must keep changes strictly scoped to the active phase assigned by the user. Do not jump ahead to initialize frameworks, install npm packages, write database schemas, or download external data without explicit instruction.

---

## 4. Fundamental Implementation Rules for Agents

### A. Honest Engineering and Data Integrity
- **No Fabricated Pharmacological Data:** Never invent pharmacological relationships, synthetic drug-drug interactions, or fake target/enzyme pathways. Graph relationships must come from verified biomedical sources.
- **No Fabricated Results:** Never invent benchmark numbers, query execution timings, test results, or claims of completed features.
- **Preserve Provenance:** When data is eventually introduced, record all sources, license terms, retrieval dates, and checksums in `data/manifests/`. Respect dataset licensing.
- **Strict Separation of Patient Data:** Synthetic patient records must remain completely distinct from sourced biomedical relationship data.

### B. Medical and Domain Disclaimers
- **Candidate Pathways Only:** Graph traversals return **candidate pathways** or mechanism-based hypotheses. Never describe multi-hop traversals as proven clinical drug interactions unless backed by explicit direct clinical interaction evidence.
- **Not a Diagnostic/Prescribing System:** Never present or market this software as a clinical prescribing system, diagnostic device, or medical advice platform. Always state that this is a database-systems research prototype.

### C. Development and Quality Standards
- **Read First:** Read relevant sections of [`FOUR_DAY_IMPLEMENTATION_PLAN.md`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/project-plan/FOUR_DAY_IMPLEMENTATION_PLAN.md) and [`DBMS_Level3_Evaluation_Criteria.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/course-requirements/DBMS_Level3_Evaluation_Criteria.pdf) before proposing or implementing changes.
- **Vertical Slice Priority:** Prioritize a small, honest, reproducible working end-to-end slice over broad, unfinished functionality.
- **Two Distinct Roles:** Maintain strict separation between Doctor and Admin roles with server-side authorization.
- **No Redundant Trees:** Avoid creating separate `frontend/`, `backend/`, or nested git repositories. Use the Next.js App Router structure with collocated routes and library modules established in this repository.

### D. Git Safety and Environment Hygiene
- **No Destructive Commands:** Never execute `git reset --hard`, `git clean -f`, or destructive checkouts that risk erasing uncommitted work.
- **No Premature Commits or Pushes:** Do not run `git commit` or `git push` unless explicitly instructed by the user.
- **Never Commit Secrets:** Do not commit `.env`, `.env.local`, API keys, database credentials, or tokens. Use `.env.example` with clear placeholders.
- **Respect .gitignore:** Ensure generated files, local databases, build artifacts, and large datasets are kept out of version control.
