-- ==============================================================================
-- 01_schema.sql
-- Relational DDL Schema with Strong Integrity Constraints
-- Patient-Specific Multi-Hop Drug Interaction Risk Discovery
-- PES University DBMS Level 3
-- ==============================================================================

-- Drop tables in reverse dependency order if recreating disposable development schema
DROP TABLE IF EXISTS assessment_findings CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS ddi_mechanisms CASCADE;
DROP TABLE IF EXISTS ddi_severities CASCADE;
DROP TABLE IF EXISTS ddi_pairs CASCADE;
DROP TABLE IF EXISTS drug_source_mappings CASCADE;
DROP TABLE IF EXISTS drugs CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;

-- ------------------------------------------------------------------------------
-- 1. DRUGS MASTER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE drugs (
    drug_id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(255) NOT NULL,
    pubchem_cid VARCHAR(50),
    inchikey VARCHAR(50),
    smiles TEXT,
    drug_type VARCHAR(100),
    therapeutic_class TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_drugs_canonical_name UNIQUE (canonical_name)
);

COMMENT ON TABLE drugs IS 'Canonical non-proprietary drug registry harmonized across biomedical datasets';
COMMENT ON COLUMN drugs.canonical_name IS 'Standardized normalized drug name for cross-source matching';

-- ------------------------------------------------------------------------------
-- 2. DRUG SOURCE MAPPINGS TABLE (PROVENANCE AUDIT)
-- ------------------------------------------------------------------------------
CREATE TABLE drug_source_mappings (
    mapping_id SERIAL PRIMARY KEY,
    drug_id INT NOT NULL,
    source_name VARCHAR(50) NOT NULL,
    source_drug_id VARCHAR(50) NOT NULL,
    source_drug_name VARCHAR(255) NOT NULL,
    match_method VARCHAR(50) NOT NULL DEFAULT 'EXACT_NORMALIZED_NAME',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mapping_drug FOREIGN KEY (drug_id) 
        REFERENCES drugs (drug_id) ON DELETE CASCADE,
    CONSTRAINT ck_mapping_source_name CHECK (source_name IN ('DDInter', 'MecDDI')),
    CONSTRAINT uq_mapping_source_entry UNIQUE (source_name, source_drug_id)
);

COMMENT ON TABLE drug_source_mappings IS 'Audit table maintaining provenance links between canonical drugs and raw source records';

-- ------------------------------------------------------------------------------
-- 3. DDI PAIRS TABLE (CANONICAL UNORDERED PAIR STORAGE)
-- ------------------------------------------------------------------------------
CREATE TABLE ddi_pairs (
    pair_id BIGSERIAL PRIMARY KEY,
    drug_a_id INT NOT NULL,
    drug_b_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pair_drug_a FOREIGN KEY (drug_a_id) 
        REFERENCES drugs (drug_id) ON DELETE RESTRICT,
    CONSTRAINT fk_pair_drug_b FOREIGN KEY (drug_b_id) 
        REFERENCES drugs (drug_id) ON DELETE RESTRICT,
    -- Strict check constraint to guarantee unique canonical ordering and prevent self-interactions
    CONSTRAINT ck_pair_canonical_ordering CHECK (drug_a_id < drug_b_id),
    CONSTRAINT uq_pair_endpoints UNIQUE (drug_a_id, drug_b_id)
);

COMMENT ON TABLE ddi_pairs IS 'Master register of documented unordered interacting drug pairs';
COMMENT ON CONSTRAINT ck_pair_canonical_ordering ON ddi_pairs IS 'Enforces drug_a_id < drug_b_id to prevent inverted duplicates and self-interactions';

-- ------------------------------------------------------------------------------
-- 4. DDI SEVERITIES TABLE (DDINTER PROVENANCE)
-- ------------------------------------------------------------------------------
CREATE TABLE ddi_severities (
    severity_id BIGSERIAL PRIMARY KEY,
    pair_id BIGINT NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    source_dataset VARCHAR(50) NOT NULL DEFAULT 'DDInter',
    source_atc_codes VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_severity_pair FOREIGN KEY (pair_id) 
        REFERENCES ddi_pairs (pair_id) ON DELETE CASCADE,
    CONSTRAINT ck_severity_level CHECK (severity_level IN ('Major', 'Moderate', 'Minor', 'Unknown')),
    CONSTRAINT uq_pair_severity_source UNIQUE (pair_id, source_dataset)
);

COMMENT ON TABLE ddi_severities IS 'Documented clinical interaction severity levels extracted from DDInter';

-- ------------------------------------------------------------------------------
-- 5. DDI MECHANISMS TABLE (MECDDI PROVENANCE)
-- ------------------------------------------------------------------------------
CREATE TABLE ddi_mechanisms (
    mechanism_id BIGSERIAL PRIMARY KEY,
    pair_id BIGINT NOT NULL,
    mechanism_category VARCHAR(100) NOT NULL,
    source_dataset VARCHAR(50) NOT NULL DEFAULT 'MecDDI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mechanism_pair FOREIGN KEY (pair_id) 
        REFERENCES ddi_pairs (pair_id) ON DELETE CASCADE,
    CONSTRAINT ck_mechanism_category CHECK (mechanism_category IN (
        'Affected cellular transport',
        'Affected excretion pathways',
        'Affected gastrointestinal absorption',
        'Affected intra/extra-hepatic metabolism',
        'Affected intra_extra-hepatic metabolism',
        'Affected organization distribution',
        'Pharmacodynamic additive effects',
        'Pharmacodynamic antagonistic effects'
    )),
    CONSTRAINT uq_pair_mechanism UNIQUE (pair_id, mechanism_category, source_dataset)
);

COMMENT ON TABLE ddi_mechanisms IS 'Pharmacological mechanism classifications extracted from MecDDI';

-- ------------------------------------------------------------------------------
-- 6. PATIENTS TABLE (SYNTHETIC ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    mrn VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    primary_condition VARCHAR(255),
    is_synthetic BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_patient_mrn UNIQUE (mrn),
    CONSTRAINT ck_patient_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    -- Strict safeguard preventing real patient health records
    CONSTRAINT ck_patient_synthetic CHECK (is_synthetic = TRUE)
);

COMMENT ON TABLE patients IS 'Synthetic patient demographic profiles for test and evaluation scenarios';

-- ------------------------------------------------------------------------------
-- 7. PRESCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    drug_id INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    prescribed_by VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_patient FOREIGN KEY (patient_id) 
        REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_drug FOREIGN KEY (drug_id) 
        REFERENCES drugs (drug_id) ON DELETE RESTRICT,
    CONSTRAINT ck_prescription_status CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'COMPLETED')),
    CONSTRAINT ck_prescription_date_range CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT uq_patient_drug_start UNIQUE (patient_id, drug_id, start_date)
);

COMMENT ON TABLE prescriptions IS 'Transactional medication regimen orders prescribed to synthetic patients';

-- ------------------------------------------------------------------------------
-- 8. RISK ASSESSMENTS TABLE (SESSION HEADERS)
-- ------------------------------------------------------------------------------
CREATE TABLE risk_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    max_hop_depth INT NOT NULL DEFAULT 2,
    total_active_medications INT NOT NULL,
    direct_interaction_count INT NOT NULL DEFAULT 0,
    multi_hop_candidate_count INT NOT NULL DEFAULT 0,
    assessment_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_patient FOREIGN KEY (patient_id) 
        REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT ck_assessment_hop_depth CHECK (max_hop_depth BETWEEN 1 AND 3)
);

COMMENT ON TABLE risk_assessments IS 'Header record documenting a clinical polypharmacy interaction risk evaluation session';

-- ------------------------------------------------------------------------------
-- 9. ASSESSMENT FINDINGS TABLE (GRANULAR PATHWAY DETECTIONS)
-- ------------------------------------------------------------------------------
CREATE TABLE assessment_findings (
    finding_id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    drug_a_id INT NOT NULL,
    drug_b_id INT NOT NULL,
    hop_count INT NOT NULL,
    traversal_path TEXT NOT NULL,
    severity_level VARCHAR(20),
    mechanism_category VARCHAR(100),
    evidence_sources VARCHAR(100) NOT NULL,
    finding_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finding_assessment FOREIGN KEY (assessment_id) 
        REFERENCES risk_assessments (assessment_id) ON DELETE CASCADE,
    CONSTRAINT fk_finding_drug_a FOREIGN KEY (drug_a_id) 
        REFERENCES drugs (drug_id) ON DELETE RESTRICT,
    CONSTRAINT fk_finding_drug_b FOREIGN KEY (drug_b_id) 
        REFERENCES drugs (drug_id) ON DELETE RESTRICT,
    CONSTRAINT ck_finding_hop_count CHECK (hop_count BETWEEN 1 AND 3),
    CONSTRAINT ck_finding_type CHECK (finding_type IN ('DOCUMENTED_DIRECT', 'CANDIDATE_PATHWAY'))
);

COMMENT ON TABLE assessment_findings IS 'Detailed interaction findings and traversal paths produced during an assessment';

-- ------------------------------------------------------------------------------
-- 10. USER ACCOUNTS TABLE (AUTHENTICATION & RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE user_accounts (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_username UNIQUE (username),
    CONSTRAINT ck_user_role CHECK (role IN ('ADMIN', 'DOCTOR'))
);

COMMENT ON TABLE user_accounts IS 'User credentials and server-side RBAC authorization roles';
