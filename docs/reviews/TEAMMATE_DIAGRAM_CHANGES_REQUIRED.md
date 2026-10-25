# Actionable Diagram Reconciliation & Correction Guide

**Document Purpose:** Exact checklist of corrections required to bring the teammate's reorganized diagrams into 100% compliance with the verified PostgreSQL database schema (`01_schema.sql`), the relational model specifications, and the official DBMS Level 3 evaluation criteria.

---

## 1. Quick Summary of Why Changes Are Needed

The reorganized layout looks cleaner, but during the reorganization, several **critical relational errors, invalid foreign keys, missing relationships, and spelling typos** were introduced. 

In a Level 3 DBMS evaluation, the examiners check that:
1. Every table and column in the diagrams matches the SQL DDL (`01_schema.sql`) **with 100% precision**.
2. Foreign key arrows strictly reflect real database constraints (no extra arrows, no missing arrows).
3. Polypharmacy business logic is valid (assessments screen *patients*, not isolated *prescriptions*).

Below is the exact step-by-step checklist to update both diagrams.

---

## 2. Checklist for Chen ER Diagram (`ER_Diagram_Final`)

### A. Semantic & Structural Relationship Fixes (Critical)
- [ ] **Fix `<UNDERGOES>` Relationship:**
  - **Current error:** Connected between `PRESCRIPTION` and `RISK_ASSESSMENT`.
  - **Correction:** Reconnect the `<UNDERGOES>` diamond so it connects between **`PATIENT`** and **`RISK_ASSESSMENT`**.
  - **Rationale:** A *patient* undergoes a risk evaluation session across all their concurrent medications; a single prescription does not undergo an assessment.
- [ ] **Add Missing `<FINDING_DRUG_A>` and `<FINDING_DRUG_B>` Relationships:**
  - **Current error:** The finding entity has no connections to `DRUG`.
  - **Correction:** Add two diamond relationship sets:
    1. `<FINDING_DRUG_A>` connecting `ASSESSMENT_FINDING` $\longleftrightarrow$ `DRUG` (cardinality `(1,1)` to `(0,N)`).
    2. `<FINDING_DRUG_B>` connecting `ASSESSMENT_FINDING` $\longleftrightarrow$ `DRUG` (cardinality `(1,1)` to `(0,N)`).
  - **Rationale:** These represent the physical foreign keys `drug_a_id` and `drug_b_id` linking every detected interaction finding back to its drug endpoints.
- [ ] **Connect `USER_ACCOUNT` via `<PERFORMED_BY>`:**
  - **Current error:** `USER_ACCOUNT` is floating in the bottom-right corner as an isolated island with zero relationships.
  - **Correction:** Draw a **dashed line** connecting `USER_ACCOUNT` to `RISK_ASSESSMENT` with a diamond labeled `<PERFORMED_BY>` (or dashed relationship connector) and add a note: `(dashed PERFORMED_BY is conceptual; session audit stores performed_by username as text, no SQL FK)`.

### B. Entity & Attribute Typos / Text Corrections
- [ ] **Fix Entity Name `AASMT_FINDING`:**
  - Change to **`ASSESSMENT_FINDING`**.
- [ ] **Fix Attribute `mm` on `PATIENT`:**
  - Change to **`mrn`** (Medical Record Number).
- [ ] **Fix Attributes on `RISK_ASSESSMENT`:**
  - Change `assesment_id` $\to$ **`assessment_id`** (missing 's').
  - Change `tot_act_medi` $\to$ **`total_active_medications`**.
  - Change `direct_count` $\to$ **`direct_interaction_count`**.
  - Change `multihop_count` $\to$ **`multi_hop_candidate_count`**.
- [ ] **Fix Attribute on `DDI_SEVERITY`:**
  - Change `severitiy_id` $\to$ **`severity_id`** (remove extra 'i').
- [ ] **Fix Attribute on `DDI_MECHANISM`:**
  - Change `mchnism_catg.` $\to$ **`mechanism_category`**.
- [ ] **Fix Relationship Text Cut-Off:**
  - Widen the diamond for `<HAS_MECHANIS>` so the full text reads **`<HAS_MECHANISM>`**.
- [ ] **Fix Attribute on `ASSESSMENT_FINDING`:**
  - Change `category` $\to$ **`mechanism_category`**.

### C. Constraint Cards & Legend
- [ ] **Restore Explanatory Constraint Cards & Legend:**
  - Add the yellow constraint callout boxes for:
    - `DDI_PAIR constraints`: `drug_a_id < drug_b_id`, `UNIQUE(drug_a_id, drug_b_id)`.
    - `Patient safeguards`: `UNIQUE(mrn)`, `gender IN (...)`, `CHECK (is_synthetic = TRUE)`.
    - `Prescription constraints`: `UNIQUE(patient_id, drug_id, start_date)`.
    - `Assessment & Finding constraints`: `hop_count BETWEEN 1 AND 3`, point-in-time snapshots.
  - Add the standard Chen notation legend (Rectangle = entity, Oval = attribute, Diamond = relationship, Double line = total participation, Dashed = conceptual).

---

## 3. Checklist for Relational Schema Diagram (`Relational_Schema_Final`)

### A. Foreign Key & Column Structure Fixes (Critical)
- [ ] **Fix `ASSESSMENT_FINDINGS` Columns & Connectors:**
  - **REMOVE `pair_id (FK)`:** Delete this column and delete the arrow pointing to `DDI_PAIRS`. (Multi-hop 2-hop/3-hop pathways have intermediary bridge drugs and do *not* resolve to a single pair in `ddi_pairs`).
  - **ADD `drug_a_id (FK)`:** Integer column referencing `drugs.drug_id`.
  - **ADD `drug_b_id (FK)`:** Integer column referencing `drugs.drug_id`.
  - **DRAW FK ARROWS:** Add connector arrows from `assessment_findings.drug_a_id` $\to$ `drugs.drug_id` and `assessment_findings.drug_b_id` $\to$ `drugs.drug_id`.
- [ ] **Fix `RISK_ASSESSMENTS` Columns & Connectors:**
  - **REMOVE `prescription_id (FK)`:** Delete this column and delete the arrow pointing to `PRESCRIPTION`. (Risk assessments evaluate a patient's entire active multi-drug regimen, not an individual prescription).
- [ ] **Verify Exactly 11 Foreign Key Arrows:**
  After applying the above fixes, verify that exactly 11 arrows exist:
  1. `drug_source_mappings.drug_id` $\to$ `drugs.drug_id`
  2. `ddi_pairs.drug_a_id` $\to$ `drugs.drug_id`
  3. `ddi_pairs.drug_b_id` $\to$ `drugs.drug_id`
  4. `ddi_severities.pair_id` $\to$ `ddi_pairs.pair_id`
  5. `ddi_mechanisms.pair_id` $\to$ `ddi_pairs.pair_id`
  6. `prescriptions.patient_id` $\to$ `patients.patient_id`
  7. `prescriptions.drug_id` $\to$ `drugs.drug_id`
  8. `risk_assessments.patient_id` $\to$ `patients.patient_id`
  9. `assessment_findings.assessment_id` $\to$ `risk_assessments.assessment_id`
  10. `assessment_findings.drug_a_id` $\to$ `drugs.drug_id`
  11. `assessment_findings.drug_b_id` $\to$ `drugs.drug_id`

### B. Table & Column Name Typos
- [ ] **Table `DDI_MECHANISMS`:**
  - Fix spelling from `DDI_MECHANISIMS` $\to$ **`DDI_MECHANISMS`** (remove the extra 'i').
- [ ] **Table `DDI_SEVERITIES`:**
  - Fix primary key spelling from `sverity_id` $\to$ **`severity_id`** (missing 'e').
- [ ] **Table `ASSESSMENT_FINDINGS`:**
  - Fix column typo from `finting_type` $\to$ **`finding_type`** (change 't' to 'd').
- [ ] **Standardize Plural Table Names (to match PostgreSQL SQL tables):**
  - Change `DRUG_SOURCE_MAPPING` $\to$ **`DRUG_SOURCE_MAPPINGS`**
  - Change `PRESCRIPTION` $\to$ **`PRESCRIPTIONS`**

### C. Data Types & Constraints
- [ ] **Add SQL Data Types to Table Boxes:**
  Instead of bare attribute names with just `(FK)`, restore the explicit PostgreSQL types to demonstrate technical rigor to the evaluators:
  - `drug_id : SERIAL PRIMARY KEY`
  - `canonical_name : VARCHAR(255) NOT NULL UNIQUE`
  - `created_at : TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `severity_level : VARCHAR(20) NOT NULL`
  - `hop_count : INT NOT NULL`
  - (Refer to `docs/database-design/Relational_Schema_Final.drawio` or `01_schema.sql` for the complete list).
- [ ] **Restore Bottom Annotation Cards:**
  - Card 1: **Key and integrity constraints** (`drugs: UNIQUE(canonical_name)`, `ddi_pairs: CHECK drug_a_id < drug_b_id`, `UNIQUE(pair_id, source_dataset)`).
  - Card 2: **Patient and transaction constraints** (`CHECK is_synthetic = TRUE`, prescription dates, hop depth `1..3`).
  - Card 3: **Implementation notes & RBAC note**.
  - Card 4: **Legend** (`PK = Primary Key underlined`, `FK = Foreign Key arrow points to referenced table`).

---

## 4. Best Workflow to Save Time

Rather than rebuilding from scratch, the easiest way is:
1. Open the existing draw.io files:
   - [`docs/database-design/ER_Diagram_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/ER_Diagram_Final.drawio)
   - [`docs/database-design/Relational_Schema_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.drawio)
2. Use draw.io's alignment and distribute tools to adjust the spacing/layout if desired.
3. Keep all existing table definitions, foreign key arrows, and constraint cards intact.
4. Export as **PNG @ 2x** and **Vector PDF**, replacing the files in `docs/database-design/`.
