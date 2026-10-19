# DAY 3 — Implementation Report: Doctor Dashboard, Patient Screening, Alerts, and Admin Console

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**Course Context:** PES University — DBMS Experiential Learning Level 3 (August–December 2026)  
**Evaluation Rubric:** Core Course Rubric (50 Marks Authority)  
**Phase:** Day 3 — Prompt 2: Full-Stack Web Application Interface  
**Execution Date:** October 19, 2026  
**Status:** Complete, Verified & Operational (All Pages Active, 26/26 Auth/RBAC Tests Passing, 30/30 Day 2 Regression Tests Passing)

---

## 1. Executive Summary

Day 3 Prompt 2 completes the full-stack user interface for the **Patient-Specific Multi-Hop Drug Interaction Risk Discovery** platform using Next.js 14 App Router, React 18, TypeScript, and a clinical-grade design system in Vanilla CSS.

Every interface element directly consumes the verified PostgreSQL relational database and Neo4j graph database backend services established in Day 2 and secured in Day 3 Prompt 1:
1. **Doctor Dashboard (`/dashboard`)**:
   - Live synthetic patient cohort fetched via `GET /api/patients`.
   - Real-time search and filter by Patient Name, MRN, or ID.
   - High-level cohort metrics (Total Patients, Polypharmacy Candidates, Active Regimen Drugs, Multi-Hop Traversal Depth).
   - Direct links to individual patient screening profiles.
2. **Patient Profile & Multi-Hop Risk Screening (`/patients/[id]`)**:
   - Comprehensive demographic view with synthetic guardrail badges.
   - Active medication regimen table with canonical drug names, therapeutic classes, dosages, and prescribers.
   - Interactive trigger button invoking `POST /api/patients/[id]/analyze-risk` with optional clinical audit notes.
   - Real-time side-by-side presentation:
     - **Direct Documented Pairwise Interactions** from PostgreSQL reference evidence (with severity badges, mechanisms, and source manifests).
     - **Candidate Multi-Hop Pathways** from Neo4j Cypher traversals (with visual pathway chains `[Warfarin] → [Amiodarone] → [Simvastatin]`, bridge drug highlights, edge severities, and explicit scientific disclaimer).
3. **Alerts & Historical Audit Console (`/alerts`)**:
   - Audit trail of historical polypharmacy assessments fetched via `GET /api/alerts`.
   - Filter by patient name, MRN, or clinician.
   - Side-by-side assessment inspection drawer detailing direct interaction counts, multi-hop counts, clinical notes, and granular finding breakdowns.
   - Direct navigation links back to patient profiles.
4. **Administrative Console (`/admin` and `/admin/users`)**:
   - Application user directory displaying active accounts from PostgreSQL `user_accounts`.
   - Account provisioning form with role selection (`DOCTOR` vs `ADMIN`) and server-side salted bcrypt password hashing.
   - Server-side RBAC protection: Doctors attempting to access `/admin` are immediately intercepted by Next.js Edge Middleware and redirected to `/dashboard` (with direct API calls returning `403 Forbidden`).
5. **Session Management & Authentication (`/login`)**:
   - Secure login form submitting credentials to `POST /api/auth/login`.
   - Quick-fill viva demonstration buttons for instantaneous testing of `dr_sharma` (Doctor) and `admin` (Admin).
   - Global Navigation bar with authenticated user profile chip, role indicator, and one-click Sign Out.

---

## 2. Directory Structure and Created Files

```text
app/
├── globals.css              # Custom clinical design system & dark mode tokens
├── layout.tsx               # Root application layout with navigation shell
├── page.tsx                 # Root router (redirects to /dashboard or /login)
├── login/
│   └── page.tsx             # System authentication & quick-fill viva buttons
├── dashboard/
│   └── page.tsx             # Doctor dashboard with patient cohort & metrics
├── patients/
│   └── [id]/
│       └── page.tsx         # Patient profile, active medications & multi-hop analysis
├── alerts/
│   └── page.tsx             # Polypharmacy alerts & assessment history audit log
└── admin/
    ├── page.tsx             # Admin user management & account provisioning
    └── users/
        └── page.tsx         # Alias route for /admin/users
components/
└── Navbar.tsx               # Global navigation bar with role badges & logout
```

---

## 3. UI/UX Features and Clinical Design System

### 3.1 Design Palette (`app/globals.css`)
- **Theme**: High-contrast, clinical dark theme (`#0a0e17` background with elevated `#111827` surface cards).
- **Typography**: Clean hierarchy with `Inter` sans-serif and `JetBrains Mono` for drug identifiers, MRNs, and pathway traces.
- **Severity Color Hierarchy**:
  - `Major`: Rose Red (`#f43f5e`, background `rgba(244, 63, 94, 0.15)`)
  - `Moderate`: Amber Warning (`#f59e0b`, background `rgba(245, 158, 11, 0.15)`)
  - `Minor`: Emerald Green (`#10b981`, background `rgba(16, 185, 129, 0.15)`)
  - `Unknown`: Purple/Violet (`#8b5cf6`, background `rgba(139, 92, 246, 0.15)`)
- **Micro-Interactions**: Smooth hover elevation, glassmorphism backdrop filters (`blur(12px)`), animated loading spinners, and glowing button accents.

### 3.2 Candidate Multi-Hop Pathway Visualizer
Rather than presenting raw JSON or static text, multi-hop pathways discovered in Neo4j are rendered as an intuitive breadcrumb chain:
```text
[Warfarin (Endpoint)] ──(Major)──> [Amiodarone (Bridge)] ──(Major)──> [Simvastatin (Endpoint)]
```
- **Endpoint Nodes**: Highlighted with indigo borders (`#6366f1`).
- **Bridge Intermediaries**: Highlighted in cyan (`#06b6d4`) and explicitly tagged with `(Bridge)`.
- **Edge Metadata**: Shows individual edge severities and hypothesis rationale.
- **Academic Disclaimer Banner**: Placed prominently above all findings:
  > *Academic Prototype & Domain Disclaimer: Graph traversals return candidate mechanism pathways and shared interaction partner hypotheses for clinical review. They do not constitute proof of clinical adverse drug events or medical prescribing advice.*

---

## 4. Role-Based Access Control and Route Protection Verification

| Route Path | Unauthenticated Visitor | Logged in as Doctor (`dr_sharma`) | Logged in as Admin (`admin`) |
|---|---|---|---|
| `/` | `307` Redirect to `/login` | `307` Redirect to `/dashboard` | `307` Redirect to `/dashboard` |
| `/login` | `200 OK` (Renders Login Form) | `200 OK` | `200 OK` |
| `/dashboard` | `307` Redirect to `/login?from=/dashboard` | `200 OK` (Doctor Dashboard) | `200 OK` (Admin Dashboard view) |
| `/patients/[id]` | `307` Redirect to `/login?from=/patients/1` | `200 OK` (Full Profile & Screening) | `200 OK` (Full Profile & Screening) |
| `/alerts` | `307` Redirect to `/login?from=/alerts` | `200 OK` (Assessment Audit Log) | `200 OK` (Assessment Audit Log) |
| `/admin` | `307` Redirect to `/login?from=/admin` | **`307` Redirect to `/dashboard`** | `200 OK` (Admin Console) |
| `/admin/users` | `307` Redirect to `/login?from=/admin/users` | **`307` Redirect to `/dashboard`** | `200 OK` (Admin Console) |
| `GET /api/admin/users` | `401 Unauthorized` | **`403 Forbidden`** | `200 OK` (User accounts JSON) |
| `POST /api/admin/users`| `401 Unauthorized` | **`403 Forbidden`** | `201 Created` (Account provisioned) |

---

## 5. Automated Verification Results

All automated test suites were executed to verify system integrity:

```bash
# 1. Day 3 Authentication, RBAC, and Database-Level Role Suite
npm run test:auth
# Result: 26/26 assertions passed

# 2. Day 2 Cross-Database Integration Suite
npm run test:integration
# Result: 30/30 assertions passed

# 3. Phase 1 Data Invariant Unit Tests
python3 -m unittest discover tests/unit/
# Result: 11/11 tests passed

# 4. TypeScript Type Checking
npx tsc --noEmit
# Result: 0 errors (clean compilation)
```

---

## 6. Demonstration & Viva Guide

### 6.1 Running the Platform
1. Ensure databases are running:
   ```bash
   docker compose up -d
   ```
2. Launch the Next.js application:
   ```bash
   npm run dev
   ```
3. Open browser at [http://localhost:3000](http://localhost:3000).

### 6.2 Suggested Viva Demonstration Steps
1. **Login Flow**:
   - Visit `http://localhost:3000`. Automatic redirect to `/login`.
   - Click **"Doctor (dr_sharma)"** quick-fill button, then click **"Sign In"**.
2. **Doctor Polypharmacy Screening**:
   - Overview cohort cards display 4 synthetic patients, 2 polypharmacy candidates, and 7 active regimen drugs.
   - Click **"Open & Analyze Risk →"** on Patient 1 (*Robert Vance*, MRN: `SYN-PAT-1001`).
   - Review the active prescriptions table (Warfarin, Amiodarone, Simvastatin).
   - Click **"Run Polypharmacy Risk Screening ⚡"**.
   - Observe live query execution across PostgreSQL (ACID) and Neo4j (Graph).
   - Review Direct Pairwise findings (Warfarin ↔ Amiodarone, Amiodarone ↔ Simvastatin).
   - Review Candidate Multi-Hop Pathway (`Warfarin → Amiodarone → Simvastatin`) with intermediary bridge drug highlights.
3. **Alerts & Audit Log**:
   - Click **"Alerts & Audits"** in the top navigation bar.
   - Inspect the historical audit record just created.
4. **RBAC Boundary Demonstration**:
   - As Doctor, attempt to manually type URL `http://localhost:3000/admin`.
   - Note immediate interception and redirect back to `/dashboard`.
5. **Admin Access & User Provisioning**:
   - Click **"Sign Out"** in the top-right corner.
   - Click **"Admin (admin)"** quick-fill button, then sign in.
   - Note the **"Admin Console"** link now visible in the top navigation bar.
   - Navigate to `/admin`. Review active user accounts in PostgreSQL.
   - Provision a new user account (e.g. `dr_mehta`, role `DOCTOR`).
   - Confirm immediate appearance in the user directory with salted bcrypt hashing.
