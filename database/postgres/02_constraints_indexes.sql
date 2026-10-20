-- ==============================================================================
-- 02_constraints_indexes.sql
-- Performance Indexes, Advanced Database Concepts, Triggers, and Stored Procedures
-- Patient-Specific Multi-Hop Drug Interaction Risk Discovery
-- PES University DBMS Level 3
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. B-TREE PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

-- Speed up canonical drug lookup by standardized name
CREATE INDEX idx_drugs_canonical_name ON drugs (canonical_name);

-- Index on external chemical identifiers
CREATE INDEX idx_drugs_pubchem_cid ON drugs (pubchem_cid);

-- Fast lookup of source mappings by internal drug ID
CREATE INDEX idx_mappings_drug_id ON drug_source_mappings (drug_id);

-- Lookup by raw external ID (e.g. searching by DDInter or MecDDI ID)
CREATE INDEX idx_mappings_source_lookup ON drug_source_mappings (source_name, source_drug_id);

-- Critical indexes on pair endpoints for fast join and screening lookups
CREATE INDEX idx_pairs_drug_a_id ON ddi_pairs (drug_a_id);
CREATE INDEX idx_pairs_drug_b_id ON ddi_pairs (drug_b_id);

-- Covering indexes on severity and mechanism child relations
CREATE INDEX idx_severities_pair_lookup ON ddi_severities (pair_id, severity_level);
CREATE INDEX idx_mechanisms_pair_lookup ON ddi_mechanisms (pair_id, mechanism_category);

-- Composite index for clinician prescription screening (active regimens)
CREATE INDEX idx_prescriptions_patient_status ON prescriptions (patient_id, status);
CREATE INDEX idx_prescriptions_drug_id ON prescriptions (drug_id);

-- Indexes on clinical assessment findings
CREATE INDEX idx_assessments_patient_id ON risk_assessments (patient_id);
CREATE INDEX idx_findings_assessment_id ON assessment_findings (assessment_id);
CREATE INDEX idx_findings_hop_count ON assessment_findings (hop_count);

-- ------------------------------------------------------------------------------
-- 2. CLINICAL VIEW: ACTIVE PATIENT MEDICATION REGIMENS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_patient_active_regimens AS
SELECT 
    p.patient_id,
    p.mrn,
    p.full_name AS patient_name,
    p.primary_condition,
    pr.prescription_id,
    d.drug_id,
    d.canonical_name AS drug_name,
    d.therapeutic_class,
    pr.dosage,
    pr.frequency,
    pr.start_date,
    pr.prescribed_by
FROM patients p
JOIN prescriptions pr ON p.patient_id = pr.patient_id
JOIN drugs d ON pr.drug_id = d.drug_id
WHERE pr.status = 'ACTIVE';

-- ------------------------------------------------------------------------------
-- 3. ADVANCED CONCEPT: TRIGGER FOR AUTOMATED RISK METRIC AGGREGATION
-- ------------------------------------------------------------------------------
-- Function executed by trigger upon finding insertion
CREATE OR REPLACE FUNCTION fn_update_assessment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.finding_type = 'DOCUMENTED_DIRECT' THEN
        UPDATE risk_assessments
        SET direct_interaction_count = direct_interaction_count + 1
        WHERE assessment_id = NEW.assessment_id;
    ELSIF NEW.finding_type = 'CANDIDATE_PATHWAY' THEN
        UPDATE risk_assessments
        SET multi_hop_candidate_count = multi_hop_candidate_count + 1
        WHERE assessment_id = NEW.assessment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger firing on each inserted finding row
DROP TRIGGER IF EXISTS trg_assessment_findings_count ON assessment_findings;
CREATE TRIGGER trg_assessment_findings_count
AFTER INSERT ON assessment_findings
FOR EACH ROW
EXECUTE FUNCTION fn_update_assessment_counts();

-- ------------------------------------------------------------------------------
-- 4. ADVANCED CONCEPT: STORED FUNCTION FOR DIRECT SCREENING EVALUATION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_perform_patient_direct_screening(
    p_patient_id INT,
    p_doctor_username VARCHAR(100),
    p_notes TEXT DEFAULT 'Routine direct pairwise screening'
)
RETURNS TABLE (
    assessment_id BIGINT,
    drug_a VARCHAR(255),
    drug_b VARCHAR(255),
    severity VARCHAR(20),
    mechanisms TEXT,
    sources VARCHAR(100)
) AS $$
DECLARE
    v_assessment_id BIGINT;
    v_med_count INT;
BEGIN
    -- 1. Determine active medication count
    SELECT COUNT(DISTINCT drug_id) INTO v_med_count
    FROM prescriptions
    WHERE patient_id = p_patient_id AND status = 'ACTIVE';

    IF v_med_count < 2 THEN
        RAISE NOTICE 'Patient % has fewer than 2 active medications; no pairwise interaction possible.', p_patient_id;
    END IF;

    -- 2. Create risk assessment session header
    INSERT INTO risk_assessments (
        patient_id, performed_by, max_hop_depth, total_active_medications, assessment_notes
    ) VALUES (
        p_patient_id, p_doctor_username, 1, v_med_count, p_notes
    ) RETURNING risk_assessments.assessment_id INTO v_assessment_id;

    -- 3. Discover direct pairwise interactions between all prescribed active drugs
    INSERT INTO assessment_findings (
        assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path,
        severity_level, mechanism_category, evidence_sources, finding_type
    )
    SELECT 
        v_assessment_id,
        dp.drug_a_id,
        dp.drug_b_id,
        1,
        da.canonical_name || ' <-> ' || db.canonical_name,
        ds.severity_level,
        string_agg(DISTINCT dm.mechanism_category, '; '),
        CASE 
            WHEN ds.severity_level IS NOT NULL AND count(dm.mechanism_category) > 0 THEN 'DDInter+MecDDI'
            WHEN ds.severity_level IS NOT NULL THEN 'DDInter'
            ELSE 'MecDDI'
        END,
        'DOCUMENTED_DIRECT'
    FROM prescriptions pr1
    JOIN prescriptions pr2 ON pr1.patient_id = pr2.patient_id AND pr1.drug_id < pr2.drug_id
    JOIN ddi_pairs dp ON dp.drug_a_id = pr1.drug_id AND dp.drug_b_id = pr2.drug_id
    JOIN drugs da ON da.drug_id = dp.drug_a_id
    JOIN drugs db ON db.drug_id = dp.drug_b_id
    LEFT JOIN ddi_severities ds ON ds.pair_id = dp.pair_id
    LEFT JOIN ddi_mechanisms dm ON dm.pair_id = dp.pair_id
    WHERE pr1.patient_id = p_patient_id 
      AND pr1.status = 'ACTIVE' 
      AND pr2.status = 'ACTIVE'
    GROUP BY dp.drug_a_id, dp.drug_b_id, da.canonical_name, db.canonical_name, ds.severity_level;

    -- 4. Return results table to caller
    RETURN QUERY
    SELECT 
        af.assessment_id,
        da.canonical_name,
        db.canonical_name,
        af.severity_level,
        af.mechanism_category::TEXT,
        af.evidence_sources
    FROM assessment_findings af
    JOIN drugs da ON da.drug_id = af.drug_a_id
    JOIN drugs db ON db.drug_id = af.drug_b_id
    WHERE af.assessment_id = v_assessment_id;
END;
$$ LANGUAGE plpgsql;
