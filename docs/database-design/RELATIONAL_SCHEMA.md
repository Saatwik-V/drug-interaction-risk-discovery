# Relational Database Schema Specification

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**DBMS:** PostgreSQL 16  
**Course:** PES University DBMS Experiential Learning Level 3 (August–December 2026)  
**Schema Artifacts:**
- **Diagram (Draw.io XML):** [`Relational_Schema_Final.drawio`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.drawio)
- **Vector Document (PDF):** [`Relational_Schema_Final.pdf`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.pdf)
- **High-Resolution Raster (PNG):** [`Relational_Schema_Final.png`](file:///Users/saatwik/Documents/dbms_mini_project/drug-interaction-risk-discovery/docs/database-design/Relational_Schema_Final.png)

---

## 1. Schema Notation Overview

Relations are presented in standard relational notation:
`RELATION_NAME (attribute_1 [PK], attribute_2 [FK], ...)`

Key designations:
- **`PK`**: Primary Key (surrogate or natural)
- **`FK`**: Foreign Key (references target table primary key with defined referential action)
- **`AK` / `U`**: Alternate Key / Unique constraint
- **`NN`**: NOT NULL constraint
- **`CK`**: CHECK domain integrity constraint

---

## 2. Table Specifications

### 2.1 `drugs`
Master catalog storing canonical drug identities harmonized across biomedical sources (MecDDI and DDInter).

`drugs (drug_id [PK], canonical_name [AK, NN], pubchem_cid, inchikey, smiles, drug_type, therapeutic_class, created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `drug_id` | `SERIAL` | `PK`, `NN` | Surrogate integer identifier for canonical drug entity. |
| `canonical_name` | `VARCHAR(255)` | `AK`, `NN` | Standardized, normalized lowercase/titlecase non-proprietary drug name. |
| `pubchem_cid` | `VARCHAR(50)` | Nullable | PubChem Compound ID for external cross-referencing. |
| `inchikey` | `VARCHAR(50)` | Nullable | Standardized 27-character hashed InChIKey. |
| `smiles` | `TEXT` | Nullable | Canonical SMILES molecular string. |
| `drug_type` | `VARCHAR(100)` | Nullable | Classification (e.g., Small molecule, Biotech, Monoclonal antibody). |
| `therapeutic_class`| `TEXT` | Nullable | High-level therapeutic/pharmacological indication text. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Row creation audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (canonical_name)`: Enforces that each chemical entity has exactly one canonical record.

---

### 2.2 `drug_source_mappings`
Maintains explicit data provenance and enables cross-referencing between external sources (DDInter, MecDDI) and canonical internal drug records.

`drug_source_mappings (mapping_id [PK], drug_id [FK], source_name [NN, CK], source_drug_id [NN], source_drug_name [NN], match_method [NN], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `mapping_id` | `SERIAL` | `PK`, `NN` | Surrogate mapping identifier. |
| `drug_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE CASCADE`. |
| `source_name` | `VARCHAR(50)` | `NN`, `CK` | `CHECK (source_name IN ('DDInter', 'MecDDI'))`. |
| `source_drug_id` | `VARCHAR(50)` | `NN` | External source identifier (e.g., `DDInter125`, `D0112`). |
| `source_drug_name`| `VARCHAR(255)`| `NN` | Exact drug name as reported in the raw source dataset. |
| `match_method` | `VARCHAR(50)` | `NN` | Reconciliation method (e.g., `EXACT_NORMALIZED_NAME`). |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Mapping creation audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (source_name, source_drug_id)`: Prevents duplicate external source IDs within a single source.

---

### 2.3 `ddi_pairs`
Authoritative register of unordered drug pairs known to have documented interactions.

`ddi_pairs (pair_id [PK], drug_a_id [FK], drug_b_id [FK], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `pair_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate identifier for canonical interaction pair. |
| `drug_a_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE CASCADE`. |
| `drug_b_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE CASCADE`. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Pair record creation timestamp. |

- **Table Constraints:**
  - `CHECK (drug_a_id < drug_b_id)`: Enforces canonical lexicographical/numeric ordering to prevent symmetric duplicates `(A, B)` vs `(B, A)` and self-interactions `(A = A)`.
  - `UNIQUE (drug_a_id, drug_b_id)`: Guarantees uniqueness of each unordered pair.

---

### 2.4 `ddi_severities`
Documented interaction severity ratings sourced from DDInter.

`ddi_severities (severity_id [PK], pair_id [FK], severity_level [NN, CK], source_dataset [NN], source_atc_codes, created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `severity_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate severity row identifier. |
| `pair_id` | `BIGINT` | `FK`, `NN` | `REFERENCES ddi_pairs(pair_id) ON DELETE CASCADE`. |
| `severity_level` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (severity_level IN ('Major', 'Moderate', 'Minor', 'Unknown'))`. |
| `source_dataset` | `VARCHAR(50)` | `NN`, `DEFAULT 'DDInter'` | Provenance source identifier. |
| `source_atc_codes`| `VARCHAR(100)`| Nullable | ATC code classifications associated with the interaction pair. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (pair_id, source_dataset)`: Ensures at most one severity rating per source dataset while supporting multi-dataset provenance in 4NF.

---

### 2.5 `ddi_mechanisms`
Documented interaction mechanism categories sourced from MecDDI.

`ddi_mechanisms (mechanism_id [PK], pair_id [FK], mechanism_category [NN, CK], source_dataset [NN], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `mechanism_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate mechanism row identifier. |
| `pair_id` | `BIGINT` | `FK`, `NN` | `REFERENCES ddi_pairs(pair_id) ON DELETE CASCADE`. |
| `mechanism_category`| `VARCHAR(100)`| `NN`, `CK` | `CHECK (mechanism_category IN ('Affected cellular transport', 'Affected excretion pathways', 'Affected gastrointestinal absorption', 'Affected intra_extra-hepatic metabolism', 'Affected organization distribution', 'Pharmacodynamic additive effects', 'Pharmacodynamic antagonistic effects'))`. |
| `source_dataset` | `VARCHAR(50)` | `NN`, `DEFAULT 'MecDDI'` | Provenance source identifier. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (pair_id, mechanism_category, source_dataset)`: Isolates independent multi-valued mechanism categories in 4NF.

---

### 2.6 `patients`
Synthetic patient master table used for testing polypharmacy risk screening workflows.

`patients (patient_id [PK], mrn [AK, NN], full_name [NN], gender [NN, CK], date_of_birth [NN], primary_condition, is_synthetic [NN, CK], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `patient_id` | `SERIAL` | `PK`, `NN` | Surrogate patient identifier. |
| `mrn` | `VARCHAR(50)` | `AK`, `NN` | Synthetic Medical Record Number (e.g., `SYN-PAT-1001`). |
| `full_name` | `VARCHAR(255)` | `NN` | Synthetic patient full name. |
| `gender` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (gender IN ('Male', 'Female', 'Other'))`. |
| `date_of_birth` | `DATE` | `NN` | Date of birth. |
| `primary_condition`| `VARCHAR(255)`| Nullable | Clinical indication / diagnosis. |
| `is_synthetic` | `BOOLEAN` | `NN`, `CK` | `CHECK (is_synthetic = TRUE)`. Architectural guardrail preventing real clinical data ingestion. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (mrn)`: Ensures synthetic MRN uniqueness across patient cohorts.

---

### 2.7 `prescriptions`
Transactional medication records linking synthetic patients to prescribed canonical drugs.

`prescriptions (prescription_id [PK], patient_id [FK], drug_id [FK], dosage [NN], frequency [NN], status [NN, CK], prescribed_by [NN], start_date [NN], end_date, created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `prescription_id` | `SERIAL` | `PK`, `NN` | Surrogate prescription identifier. |
| `patient_id` | `INT` | `FK`, `NN` | `REFERENCES patients(patient_id) ON DELETE CASCADE`. |
| `drug_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE RESTRICT`. |
| `dosage` | `VARCHAR(100)` | `NN` | Prescribed dosage string (e.g., `20mg`). |
| `frequency` | `VARCHAR(100)` | `NN` | Administration frequency (e.g., `Once daily`). |
| `status` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'COMPLETED'))`. |
| `prescribed_by` | `VARCHAR(100)` | `NN` | Prescribing clinician username (audit string, no SQL FK). |
| `start_date` | `DATE` | `NN` | Effective start date of medication regimen. |
| `end_date` | `DATE` | Nullable | Optional termination date (`CHECK (end_date IS NULL OR end_date >= start_date)`). |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (patient_id, drug_id, start_date)`: Prevents duplicate active prescription entries for the same drug on the same day.

---

### 2.8 `risk_assessments`
Clinical risk screening session header recording polypharmacy traversal executions.

`risk_assessments (assessment_id [PK], patient_id [FK], performed_by [NN], max_hop_depth [NN, CK], total_active_medications [NN], direct_interaction_count [NN], multi_hop_candidate_count [NN], assessment_notes, created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `assessment_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate assessment identifier. |
| `patient_id` | `INT` | `FK`, `NN` | `REFERENCES patients(patient_id) ON DELETE CASCADE`. |
| `performed_by` | `VARCHAR(100)` | `NN` | Evaluating clinician username (audit string, no SQL FK). |
| `max_hop_depth` | `INT` | `NN`, `CK` | `CHECK (max_hop_depth BETWEEN 1 AND 3)`. |
| `total_active_medications`| `INT` | `NN` | Count of active drugs evaluated in session. |
| `direct_interaction_count`| `INT` | `NN`, `DEFAULT 0` | Count of direct (1-hop) interactions found. |
| `multi_hop_candidate_count`| `INT` | `NN`, `DEFAULT 0` | Count of indirect (2-hop/3-hop) candidate paths found. |
| `assessment_notes` | `TEXT` | Nullable | Clinician rationale or review notes. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Assessment execution timestamp. |

- **Trigger Maintenance:**
  - Counts are automatically incremented by the trigger `trg_assessment_findings_count` executing `fn_update_assessment_counts()` with `SECURITY DEFINER` privileges.

---

### 2.9 `assessment_findings`
Detailed interaction findings and traversal pathways identified during a risk assessment session.

`assessment_findings (finding_id [PK], assessment_id [FK], drug_a_id [FK], drug_b_id [FK], hop_count [NN, CK], traversal_path [NN], severity_level, mechanism_category, evidence_sources [NN], finding_type [NN, CK], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `finding_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate finding identifier. |
| `assessment_id` | `BIGINT` | `FK`, `NN` | `REFERENCES risk_assessments(assessment_id) ON DELETE CASCADE`. |
| `drug_a_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE RESTRICT`. |
| `drug_b_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE RESTRICT`. |
| `hop_count` | `INT` | `NN`, `CK` | `CHECK (hop_count BETWEEN 1 AND 3)`. |
| `traversal_path` | `TEXT` | `NN` | Human-readable explanation path (e.g., `Aspirin -> Warfarin`). |
| `severity_level` | `VARCHAR(20)` | Nullable | Point-in-time snapshot of DDInter severity. |
| `mechanism_category`| `VARCHAR(100)`| Nullable | Point-in-time snapshot of MecDDI mechanism category. |
| `evidence_sources`| `VARCHAR(100)` | `NN` | Data sources backing path edges (e.g., `DDInter+MecDDI`). |
| `finding_type` | `VARCHAR(50)` | `NN`, `CK` | `CHECK (finding_type IN ('DOCUMENTED_DIRECT', 'CANDIDATE_PATHWAY'))`. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Finding record timestamp. |

---

### 2.10 `user_accounts`
Supports role-based authentication and authorization (Doctor vs. Admin) for API and UI access.

`user_accounts (user_id [PK], username [AK, NN], password_hash [NN], full_name [NN], role [NN, CK], is_active [NN], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `user_id` | `SERIAL` | `PK`, `NN` | Surrogate user identifier. |
| `username` | `VARCHAR(100)` | `AK`, `NN` | Unique login username. |
| `password_hash` | `VARCHAR(255)` | `NN` | Bcrypt salted cryptographic password hash. |
| `full_name` | `VARCHAR(255)` | `NN` | Clinician or administrator display name. |
| `role` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (role IN ('ADMIN', 'DOCTOR'))`. |
| `is_active` | `BOOLEAN` | `NN`, `DEFAULT TRUE` | User account status flag. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp. |

- **Table Constraints:**
  - `UNIQUE (username)`: Ensures unique login handles across system accounts.

---

## 3. Referential Cardinality Summary

The table below summarizes all enforced foreign key constraints and cardinality rules across the 10 relations:

| Parent Relation | Child Relation | Cardinality | Enforced Foreign Key | Referential Action (ON DELETE) | Business Meaning |
|---|---|---|---|---|---|
| `drugs` | `drug_source_mappings` | `1 : 0..N` | `drug_source_mappings.drug_id` | `CASCADE` | A canonical drug maps to zero or more source records (DDInter, MecDDI). |
| `drugs` | `ddi_pairs` (as `drug_a`) | `1 : 0..N` | `ddi_pairs.drug_a_id` | `CASCADE` | A drug participates in interaction pairs as first endpoint (`drug_a_id < drug_b_id`). |
| `drugs` | `ddi_pairs` (as `drug_b`) | `1 : 0..N` | `ddi_pairs.drug_b_id` | `CASCADE` | A drug participates in interaction pairs as second endpoint. |
| `ddi_pairs` | `ddi_severities` | `1 : 0..N` | `ddi_severities.pair_id` | `CASCADE` | A pair has zero or more severity ratings under `UNIQUE(pair_id, source_dataset)`. |
| `ddi_pairs` | `ddi_mechanisms` | `1 : 0..N` | `ddi_mechanisms.pair_id` | `CASCADE` | A pair has zero, one, or multiple mechanism categories from MecDDI in 4NF. |
| `patients` | `prescriptions` | `1 : 0..N` | `prescriptions.patient_id` | `CASCADE` | A patient receives zero or more prescriptions over time. |
| `drugs` | `prescriptions` | `1 : 0..N` | `prescriptions.drug_id` | `RESTRICT` | A drug is referenced in zero or more prescription records. Deletion is restricted if prescribed. |
| `patients` | `risk_assessments` | `1 : 0..N` | `risk_assessments.patient_id` | `CASCADE` | A patient undergoes zero or more screening assessments. |
| `risk_assessments` | `assessment_findings` | `1 : 0..N` | `assessment_findings.assessment_id` | `CASCADE` | An assessment produces zero or more identified interaction paths. |
| `drugs` | `assessment_findings` (as `drug_a`) | `1 : 0..N` | `assessment_findings.drug_a_id` | `RESTRICT` | First drug endpoint of an interaction finding. |
| `drugs` | `assessment_findings` (as `drug_b`) | `1 : 0..N` | `assessment_findings.drug_b_id` | `RESTRICT` | Second drug endpoint of an interaction finding. |

> [!NOTE]
> **Audit Field Design (No Foreign Key):**  
> `prescriptions.prescribed_by` and `risk_assessments.performed_by` record clinician usernames as text strings without physical database foreign keys to `user_accounts`. This architectural choice preserves immutable clinical audit records even if user accounts are deactivated or migrated, and prevents cross-domain locking between user authentication and patient screening transactions. In `ER_Diagram_Final.drawio`, this relationship is explicitly noted as conceptual (`dashed line`).
