-- ==============================================================================
-- 05_roles_rbac.sql
-- Database-Level Role-Based Access Control (RBAC) & Least-Privilege Grants
-- Patient-Specific Multi-Hop Drug Interaction Risk Discovery
-- PES University DBMS Level 3
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. IDEMPOTENT CREATION OF ROLES & APPLICATION USERS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Create group roles if not existing
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_doctor') THEN
        CREATE ROLE role_doctor NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'role_admin') THEN
        CREATE ROLE role_admin NOLOGIN;
    END IF;

    -- Create / alter dedicated login users
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_doctor_user') THEN
        CREATE USER app_doctor_user WITH PASSWORD 'DoctorPass#2026';
    ELSE
        ALTER USER app_doctor_user WITH PASSWORD 'DoctorPass#2026';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin_user') THEN
        CREATE USER app_admin_user WITH PASSWORD 'AdminPass#2026';
    ELSE
        ALTER USER app_admin_user WITH PASSWORD 'AdminPass#2026';
    END IF;

    -- Grant group roles to application users
    GRANT role_doctor TO app_doctor_user;
    GRANT role_admin TO app_admin_user;
END $$;

COMMENT ON ROLE role_doctor IS 'Least-privilege clinician role: read drugs/patients, write prescriptions and assessments, NO access to user credentials';
COMMENT ON ROLE role_admin IS 'Administrative role: full access to manage accounts, audit logs, and clinical metadata';

-- ------------------------------------------------------------------------------
-- 2. DEFINE PERMISSIONS FOR role_doctor (LEAST PRIVILEGE)
-- ------------------------------------------------------------------------------
-- Schema usage
GRANT USAGE ON SCHEMA public TO role_doctor;

-- Read-only clinical reference knowledge base
GRANT SELECT ON TABLE drugs TO role_doctor;
GRANT SELECT ON TABLE drug_source_mappings TO role_doctor;
GRANT SELECT ON TABLE ddi_pairs TO role_doctor;
GRANT SELECT ON TABLE ddi_severities TO role_doctor;
GRANT SELECT ON TABLE ddi_mechanisms TO role_doctor;
GRANT SELECT ON TABLE v_patient_active_regimens TO role_doctor;

-- Clinical patient care & prescribing
GRANT SELECT ON TABLE patients TO role_doctor;
GRANT SELECT, INSERT, UPDATE ON TABLE prescriptions TO role_doctor;
GRANT USAGE, SELECT ON SEQUENCE prescriptions_prescription_id_seq TO role_doctor;

-- Risk assessment session authoring
GRANT SELECT, INSERT ON TABLE risk_assessments TO role_doctor;
GRANT USAGE, SELECT ON SEQUENCE risk_assessments_assessment_id_seq TO role_doctor;
GRANT SELECT, INSERT ON TABLE assessment_findings TO role_doctor;
GRANT USAGE, SELECT ON SEQUENCE assessment_findings_finding_id_seq TO role_doctor;

-- Execution of stored evaluation procedures
GRANT EXECUTE ON FUNCTION fn_perform_patient_direct_screening(INT, VARCHAR, TEXT) TO role_doctor;
GRANT EXECUTE ON FUNCTION fn_update_assessment_counts() TO role_doctor;

-- CRITICAL SECURITY BOUNDARY:
-- Explicitly revoke access to user_accounts table from role_doctor and public
REVOKE ALL ON TABLE user_accounts FROM role_doctor;
REVOKE ALL ON TABLE user_accounts FROM PUBLIC;

-- ------------------------------------------------------------------------------
-- 3. DEFINE PERMISSIONS FOR role_admin (ADMINISTRATIVE OVERSIGHT)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO role_admin;

-- Administrative authority over user accounts (CRUD)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_accounts TO role_admin;
GRANT USAGE, SELECT ON SEQUENCE user_accounts_user_id_seq TO role_admin;

-- Audit and clinical oversight on all application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE patients TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE prescriptions TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE risk_assessments TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE assessment_findings TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drugs TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_source_mappings TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ddi_pairs TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ddi_severities TO role_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ddi_mechanisms TO role_admin;
GRANT SELECT ON TABLE v_patient_active_regimens TO role_admin;

-- Sequence usage for admin operations
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO role_admin;

-- Function execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO role_admin;
