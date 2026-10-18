# Relational Database Schema Specification

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**DBMS:** PostgreSQL 15+  
**Course:** PES University DBMS Experiential Learning Level 3  

---

## 1. Schema Notation Overview

Relations are presented in standard relational notation:
`RELATION_NAME (attribute_1 [PK], attribute_2 [FK], ...)`

Key designations:
- **`PK`**: Primary Key
- **`FK`**: Foreign Key (references target table and attribute)
- **`AK` / `U`**: Alternate Key / Unique constraint
- **`NN`**: NOT NULL constraint
- **`CK`**: CHECK constraint

---

## 2. Table Specifications

### 2.1 `drugs`
Master table storing canonical drug identities harmonized across biomedical sources.

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

---

### 2.2 `drug_source_mappings`
Maintains explicit data provenance and enables cross-referencing between external sources (DDInter, MecDDI) and canonical internal drug records.

`drug_source_mappings (mapping_id [PK], drug_id [FK], source_name [NN, CK], source_drug_id [NN], source_drug_name [NN], match_method [NN], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `mapping_id` | `SERIAL` | `PK`, `NN` | Surrogate identifier for source mapping entry. |
| `drug_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE CASCADE`. |
| `source_name` | `VARCHAR(50)` | `NN`, `CK` | `CHECK (source_name IN ('DDInter', 'MecDDI'))`. |
| `source_drug_id` | `VARCHAR(50)` | `NN` | Original identifier from source (e.g., `DDInter125`, `D0112`). |
| `source_drug_name`| `VARCHAR(255)`| `NN` | Literal drug name as spelled in raw source. |
| `match_method` | `VARCHAR(50)` | `NN` | Strategy used (e.g., `EXACT_NORMALIZED_NAME`). |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp. |

- **Table Constraints:**
  - `UNIQUE (source_name, source_drug_id)`: Prevents mapping the same source record to multiple canonical drugs.

---

### 2.3 `ddi_pairs`
Stores documented unordered drug-drug interaction pairs. Enforces strict canonical ID ordering to guarantee pair uniqueness and prevent self-interactions.

`ddi_pairs (pair_id [PK], drug_a_id [FK], drug_b_id [FK], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `pair_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate identifier for interaction pair. |
| `drug_a_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE RESTRICT`. |
| `drug_b_id` | `INT` | `FK`, `NN` | `REFERENCES drugs(drug_id) ON DELETE RESTRICT`. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `CHECK (drug_a_id < drug_b_id)`: Strictly enforces `drug_a_id < drug_b_id`, preventing self-interaction (`drug_a_id = drug_b_id`) and preventing inverted duplicate pairs `(B, A)`.
  - `UNIQUE (drug_a_id, drug_b_id)`: Enforces uniqueness of unordered pairs at the database level.

---

### 2.4 `ddi_severities`
Stores severity ratings sourced exclusively from DDInter. Maintains strict separation from mechanism classifications.

`ddi_severities (severity_id [PK], pair_id [FK], severity_level [NN, CK], source_dataset [NN], source_atc_codes, created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `severity_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate identifier for severity record. |
| `pair_id` | `BIGINT` | `FK`, `NN` | `REFERENCES ddi_pairs(pair_id) ON DELETE CASCADE`. |
| `severity_level` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (severity_level IN ('Major', 'Moderate', 'Minor', 'Unknown'))`. |
| `source_dataset` | `VARCHAR(50)` | `NN`, `DEFAULT 'DDInter'` | Provenance source identifier. |
| `source_atc_codes`| `VARCHAR(100)`| Nullable | Comma-separated ATC classification codes (e.g., `A,B,L`). |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (pair_id, source_dataset)`: A single pair has exactly one authoritative severity record per source.

---

### 2.5 `ddi_mechanisms`
Stores mechanism categories sourced exclusively from MecDDI. Allows representation of multi-mechanism pairs (up to 3 categories) without repeating columns.

`ddi_mechanisms (mechanism_id [PK], pair_id [FK], mechanism_category [NN, CK], source_dataset [NN], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `mechanism_id` | `BIGSERIAL` | `PK`, `NN` | Surrogate identifier for mechanism category. |
| `pair_id` | `BIGINT` | `FK`, `NN` | `REFERENCES ddi_pairs(pair_id) ON DELETE CASCADE`. |
| `mechanism_category`| `VARCHAR(100)`| `NN`, `CK` | `CHECK (mechanism_category IN ('Affected cellular transport', 'Affected excretion pathways', 'Affected gastrointestinal absorption', 'Affected intra_extra-hepatic metabolism', 'Affected organization distribution', 'Pharmacodynamic additive effects', 'Pharmacodynamic antagonistic effects'))`. |
| `source_dataset` | `VARCHAR(50)` | `NN`, `DEFAULT 'MecDDI'` | Provenance source identifier. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

- **Table Constraints:**
  - `UNIQUE (pair_id, mechanism_category, source_dataset)`: Prevents duplicate category assignment for the same pair.

---

### 2.6 `patients`
Synthetic patient master table used for testing and polypharmacy evaluation.

`patients (patient_id [PK], mrn [AK, NN], full_name [NN], gender [NN, CK], date_of_birth [NN], primary_condition, is_synthetic [NN, CK], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `patient_id` | `SERIAL` | `PK`, `NN` | Surrogate patient identifier. |
| `mrn` | `VARCHAR(50)` | `AK`, `NN` | Synthetic Medical Record Number (e.g., `SYN-PAT-1001`). |
| `full_name` | `VARCHAR(255)` | `NN` | Synthetic patient full name. |
| `gender` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (gender IN ('Male', 'Female', 'Other'))`. |
| `date_of_birth` | `DATE` | `NN` | Date of birth. |
| `primary_condition`| `VARCHAR(255)`| Nullable | Clinical indication / diagnosis. |
| `is_synthetic` | `BOOLEAN` | `NN`, `CK` | `CHECK (is_synthetic = TRUE)`. Enforces that real patient data cannot be stored. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp. |

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
| `prescribed_by` | `VARCHAR(100)` | `NN` | Prescribing physician username or identifier. |
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
| `performed_by` | `VARCHAR(100)` | `NN` | Evaluating clinician username. |
| `max_hop_depth` | `INT` | `NN`, `CK` | `CHECK (max_hop_depth BETWEEN 1 AND 3)`. |
| `total_active_medications`| `INT` | `NN` | Count of active drugs evaluated in session. |
| `direct_interaction_count`| `INT` | `NN`, `DEFAULT 0` | Count of direct (1-hop) interactions found. |
| `multi_hop_candidate_count`| `INT` | `NN`, `DEFAULT 0` | Count of indirect (2-hop/3-hop) candidate paths. |
| `assessment_notes` | `TEXT` | Nullable | Clinician rationale or review notes. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Assessment execution timestamp. |

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
| `severity_level` | `VARCHAR(20)` | Nullable | DDInter severity if direct or inferred. |
| `mechanism_category`| `VARCHAR(100)`| Nullable | MecDDI mechanism category if direct or inferred. |
| `evidence_sources`| `VARCHAR(100)` | `NN` | Data sources backing path edges (e.g., `DDInter+MecDDI`). |
| `finding_type` | `VARCHAR(50)` | `NN`, `CK` | `CHECK (finding_type IN ('DOCUMENTED_DIRECT', 'CANDIDATE_PATHWAY'))`. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Finding record timestamp. |

---

### 2.10 `user_accounts`
Supports role-based authentication and authorization (Doctor vs. Admin) for API access.

`user_accounts (user_id [PK], username [AK, NN], password_hash [NN], full_name [NN], role [NN, CK], is_active [NN], created_at [NN])`

| Attribute | Data Type | Constraints | Description & Referential Actions |
|---|---|---|---|
| `user_id` | `SERIAL` | `PK`, `NN` | Surrogate user identifier. |
| `username` | `VARCHAR(100)` | `AK`, `NN` | Unique login username. |
| `password_hash` | `VARCHAR(255)` | `NN` | Argon2id or bcrypt salted password hash. |
| `full_name` | `VARCHAR(255)` | `NN` | Clinician or administrator name. |
| `role` | `VARCHAR(20)` | `NN`, `CK` | `CHECK (role IN ('ADMIN', 'DOCTOR'))`. |
| `is_active` | `BOOLEAN` | `NN`, `DEFAULT TRUE` | User account status flag. |
| `created_at` | `TIMESTAMPTZ` | `NN`, `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp. |

---

## 3. Referential Cardinality Summary

| Parent Relation | Child Relation | Cardinality | Business Meaning |
|---|---|---|---|
| `drugs` | `drug_source_mappings` | `1 : 0..N` | A canonical drug can map to multiple source IDs (DDInter, MecDDI). |
| `drugs` | `ddi_pairs` (as `drug_a`) | `1 : 0..N` | A drug participates in interaction pairs as first endpoint. |
| `drugs` | `ddi_pairs` (as `drug_b`) | `1 : 0..N` | A drug participates in interaction pairs as second endpoint. |
| `ddi_pairs` | `ddi_severities` | `1 : 0..1` | A pair has at most one authoritative severity rating from DDInter. |
| `ddi_pairs` | `ddi_mechanisms` | `1 : 0..N` | A pair has zero, one, or multiple mechanism categories from MecDDI. |
| `patients` | `prescriptions` | `1 : 0..N` | A patient receives zero or more prescriptions over time. |
| `drugs` | `prescriptions` | `1 : 0..N` | A drug is referenced in zero or more prescription records. |
| `patients` | `risk_assessments` | `1 : 0..N` | A patient undergoes zero or more screening assessments. |
| `risk_assessments` | `assessment_findings` | `1 : 0..N` | An assessment produces zero or more identified interaction paths. |
| `user_accounts` | `prescriptions` | `1 : 0..N` | A clinician writes zero or more prescriptions. |
| `user_accounts` | `risk_assessments` | `1 : 0..N` | A clinician performs zero or more risk evaluations. |
