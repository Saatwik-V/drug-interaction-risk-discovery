# Project Data Dictionary

**Project:** Patient-Specific Multi-Hop Drug Interaction Risk Discovery  
**DBMS:** PostgreSQL 15+  
**Classification:** Academic Decision Support Prototype  

---

## 1. Overview of Data Origins

Each attribute in the database originates from one of four defined provenance channels:
1. **Source: MecDDI**: Directly extracted from MecDDI raw records (`Drug General Information.csv`, mechanism files).
2. **Source: DDInter**: Directly extracted from DDInter raw records (`ddinter_downloads_code_*.csv`).
3. **Application Generated**: Computed or assigned by the application logic during ingestion or risk screening.
4. **Synthetic**: Artificially generated for test execution and evaluation (patients, prescriptions).

---

## 2. Table and Column Catalog

### 2.1 Table: `drugs`
Master table containing canonical non-proprietary drug records.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `drug_id` | `SERIAL` | No | `PRIMARY KEY` | Application Generated | Unique surrogate integer assigned to each canonical drug. |
| `canonical_name` | `VARCHAR(255)` | No | `UNIQUE` | Source: MecDDI / DDInter | Normalized lowercased/titlecased drug name used for matching. |
| `pubchem_cid` | `VARCHAR(50)` | Yes | — | Source: MecDDI | PubChem Compound Identification number. |
| `inchikey` | `VARCHAR(50)` | Yes | — | Source: MecDDI | Standard International Chemical Identifier 27-character hash. |
| `smiles` | `TEXT` | Yes | — | Source: MecDDI | Canonical Simplified Molecular-Input Line-Entry System string. |
| `drug_type` | `VARCHAR(100)` | Yes | — | Source: MecDDI | Molecular classification (e.g., `Small molecule`, `Biotech`). |
| `therapeutic_class`| `TEXT` | Yes | — | Source: MecDDI | Pharmacological / anatomical therapeutic category text. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | System timestamp when canonical drug was staged. |

---

### 2.2 Table: `drug_source_mappings`
Audit and cross-reference table mapping canonical drugs to raw source identifiers.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `mapping_id` | `SERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate mapping row identifier. |
| `drug_id` | `INT` | No | `FOREIGN KEY` (drugs) | Application Generated | Reference to internal canonical drug record. |
| `source_name` | `VARCHAR(50)` | No | `CHECK IN ('DDInter', 'MecDDI')` | Application Generated | Origin database name. |
| `source_drug_id` | `VARCHAR(50)` | No | Part of `UNIQUE` | Source: Raw File | Literal external ID (e.g. `DDInter125` or `D0112`). |
| `source_drug_name`| `VARCHAR(255)`| No | — | Source: Raw File | Exact spelling of drug name as given in external source. |
| `match_method` | `VARCHAR(50)` | No | — | Application Generated | String indicating reconciliation rule (e.g., `EXACT_NORMALIZED_NAME`). |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Audit timestamp. |

---

### 2.3 Table: `ddi_pairs`
Authoritative register of unordered drug pairs known to have documented interactions.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `pair_id` | `BIGSERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate interaction pair identifier. |
| `drug_a_id` | `INT` | No | `FOREIGN KEY` (drugs) | Application Generated | First drug in canonical order (`drug_a_id < drug_b_id`). |
| `drug_b_id` | `INT` | No | `FOREIGN KEY` (drugs) | Application Generated | Second drug in canonical order (`drug_b_id > drug_a_id`). |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Record creation timestamp. |

- *Invariants:* `CHECK (drug_a_id < drug_b_id)`, `UNIQUE (drug_a_id, drug_b_id)`.

---

### 2.4 Table: `ddi_severities`
Documented interaction severity ratings from DDInter.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `severity_id` | `BIGSERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate severity row identifier. |
| `pair_id` | `BIGINT` | No | `FOREIGN KEY` (ddi_pairs) | Application Generated | Reference to canonical interaction pair. |
| `severity_level` | `VARCHAR(20)` | No | `CHECK IN ('Major', 'Moderate', 'Minor', 'Unknown')` | Source: DDInter | Reported clinical interaction severity. Original label preserved without alteration. |
| `source_dataset` | `VARCHAR(50)` | No | `DEFAULT 'DDInter'` | Application Generated | Dataset tracking constant. |
| `source_atc_codes`| `VARCHAR(100)`| Yes | — | Source: DDInter | Comma-separated list of ATC code categories containing pair. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Creation timestamp. |

---

### 2.5 Table: `ddi_mechanisms`
Documented interaction mechanism categories from MecDDI.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `mechanism_id` | `BIGSERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate mechanism row identifier. |
| `pair_id` | `BIGINT` | No | `FOREIGN KEY` (ddi_pairs) | Application Generated | Reference to canonical interaction pair. |
| `mechanism_category`| `VARCHAR(100)`| No | `CHECK IN (...)` | Source: MecDDI | One of 7 valid categories: `Affected cellular transport`, `Affected excretion pathways`, `Affected gastrointestinal absorption`, `Affected intra_extra-hepatic metabolism`, `Affected organization distribution`, `Pharmacodynamic additive effects`, `Pharmacodynamic antagonistic effects`. |
| `source_dataset` | `VARCHAR(50)` | No | `DEFAULT 'MecDDI'` | Application Generated | Dataset tracking constant. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Creation timestamp. |

---

### 2.6 Table: `patients`
Synthetic patient demographics for testing polypharmacy medication regimens.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `patient_id` | `SERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate patient record ID. |
| `mrn` | `VARCHAR(50)` | No | `UNIQUE` | Synthetic | Synthetic Medical Record Number (e.g., `SYN-PAT-1001`). |
| `full_name` | `VARCHAR(255)` | No | — | Synthetic | Synthetic patient name. |
| `gender` | `VARCHAR(20)` | No | `CHECK IN ('Male', 'Female', 'Other')` | Synthetic | Gender identity. |
| `date_of_birth` | `DATE` | No | — | Synthetic | Synthetic date of birth. |
| `primary_condition`| `VARCHAR(255)`| Yes | — | Synthetic | Primary diagnosis (e.g., `Hypertension`, `Type 2 Diabetes`). |
| `is_synthetic` | `BOOLEAN` | No | `CHECK (is_synthetic = TRUE)` | Synthetic | Architectural guardrail ensuring only synthetic data exists. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Record creation timestamp. |

---

### 2.7 Table: `prescriptions`
Transactional prescription orders for synthetic patients.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `prescription_id` | `SERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate prescription record ID. |
| `patient_id` | `INT` | No | `FOREIGN KEY` (patients) | Synthetic | Reference to synthetic patient. |
| `drug_id` | `INT` | No | `FOREIGN KEY` (drugs) | Application Generated | Reference to prescribed canonical drug. |
| `dosage` | `VARCHAR(100)` | No | — | Synthetic | Dosage description (e.g., `100mg`, `5mg/day`). |
| `frequency` | `VARCHAR(100)` | No | — | Synthetic | Dosing schedule (e.g., `Twice daily with meals`). |
| `status` | `VARCHAR(20)` | No | `CHECK IN ('ACTIVE', 'DISCONTINUED', 'COMPLETED')` | Synthetic | Clinical regimen lifecycle status. |
| `prescribed_by` | `VARCHAR(100)` | No | — | Synthetic | Username of prescribing clinician. |
| `start_date` | `DATE` | No | — | Synthetic | Regimen initiation date. |
| `end_date` | `DATE` | Yes | `CHECK (end_date >= start_date)` | Synthetic | Regimen cessation date. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Prescription creation timestamp. |

---

### 2.8 Table: `risk_assessments`
Clinical screening session summary documenting polypharmacy risk runs.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `assessment_id` | `BIGSERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate session ID. |
| `patient_id` | `INT` | No | `FOREIGN KEY` (patients) | Synthetic | Patient screened during session. |
| `performed_by` | `VARCHAR(100)` | No | — | Synthetic / App | Clinician username performing evaluation. |
| `max_hop_depth` | `INT` | No | `CHECK BETWEEN 1 AND 3` | Application Generated | Traversal search radius (1, 2, or 3 hops). |
| `total_active_medications`| `INT` | No | — | Application Generated | Total active drugs evaluated. |
| `direct_interaction_count`| `INT` | No | `DEFAULT 0` | Application Generated | Number of 1-hop pairwise interactions found. |
| `multi_hop_candidate_count`| `INT` | No | `DEFAULT 0` | Application Generated | Number of 2-hop and 3-hop candidate paths found. |
| `assessment_notes` | `TEXT` | Yes | — | Synthetic / App | Doctor remarks on screening results. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Timestamp when assessment occurred. |

---

### 2.9 Table: `assessment_findings`
Specific interaction risks and multi-hop candidate paths identified during an assessment.

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `finding_id` | `BIGSERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate finding identifier. |
| `assessment_id` | `BIGINT` | No | `FOREIGN KEY` (risk_assessments) | Application Generated | Reference to parent assessment session. |
| `drug_a_id` | `INT` | No | `FOREIGN KEY` (drugs) | Application Generated | First medication in path. |
| `drug_b_id` | `INT` | No | `FOREIGN KEY` (drugs) | Application Generated | Second medication in path. |
| `hop_count` | `INT` | No | `CHECK BETWEEN 1 AND 3` | Application Generated | Graph path length (1 = direct, 2 or 3 = candidate multi-hop). |
| `traversal_path` | `TEXT` | No | — | Application Generated | Formatted path string: `DrugA -> IntermediaryDrug -> DrugB`. |
| `severity_level` | `VARCHAR(20)` | Yes | — | Source / Inferred | DDInter severity (`Major`, `Moderate`, `Minor`, `Unknown`). |
| `mechanism_category`| `VARCHAR(100)`| Yes | — | Source / Inferred | MecDDI category string. |
| `evidence_sources`| `VARCHAR(100)` | No | — | Application Generated | Sources backing path edges (e.g., `DDInter+MecDDI`). |
| `finding_type` | `VARCHAR(50)` | No | `CHECK IN ('DOCUMENTED_DIRECT', 'CANDIDATE_PATHWAY')` | Application Generated | Critical classifier: direct pairwise interaction vs mechanism candidate. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Timestamp of finding generation. |

---

### 2.10 Table: `user_accounts`
User authentication and role-based access control (Doctor vs. Admin).

| Column Name | Data Type | Nullable | Key / Constraints | Provenance | Description & Permitted Values |
|---|---|---|---|---|---|
| `user_id` | `SERIAL` | No | `PRIMARY KEY` | Application Generated | Surrogate user identifier. |
| `username` | `VARCHAR(100)` | No | `UNIQUE` | Application Generated | Unique login credential handle. |
| `password_hash` | `VARCHAR(255)` | No | — | Application Generated | Salted cryptographic password hash. |
| `full_name` | `VARCHAR(255)` | No | — | Application Generated | User display name. |
| `role` | `VARCHAR(20)` | No | `CHECK IN ('ADMIN', 'DOCTOR')` | Application Generated | Security authorization role. |
| `is_active` | `BOOLEAN` | No | `DEFAULT TRUE` | Application Generated | Account activation status. |
| `created_at` | `TIMESTAMPTZ` | No | `DEFAULT NOW()` | Application Generated | Account creation timestamp. |
