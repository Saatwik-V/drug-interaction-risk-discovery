-- ==============================================================================
-- 03_seed_synthetic.sql
-- Curated Demonstration Cohort and Synthetic Patient Regimens
-- Patient-Specific Multi-Hop Drug Interaction Risk Discovery
-- PES University DBMS Level 3
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED CANONICAL DRUGS (CORE DEMONSTRATION SET)
-- ------------------------------------------------------------------------------
INSERT INTO drugs (drug_id, canonical_name, pubchem_cid, inchikey, smiles, drug_type, therapeutic_class) VALUES
(1, 'warfarin', '54678486', 'PJVWKTKQMONHTI-UHFFFAOYSA-N', 'CC(=O)CC(C1=CC=CC=C1)C2=C(C3=CC=CC=C3OC2=O)O', 'Small molecule', 'Anticoagulants'),
(2, 'aspirin', '2244', 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N', 'CC(=O)OC1=CC=CC=C1C(=O)O', 'Small molecule', 'Platelet Aggregation Inhibitors'),
(3, 'ibuprofen', '3672', 'HEFNNWSXXWATRW-UHFFFAOYSA-N', 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', 'Small molecule', 'Anti-Inflammatory Agents, Non-Steroidal'),
(4, 'amiodarone', '2157', 'ITCLRLVYTPMVNW-UHFFFAOYSA-N', 'CCCCCC1=C(C2=CC=CC=C2O1)C(=O)C3=CC(=C(C(=C3)I)OCCN(CC)CC)I', 'Small molecule', 'Anti-Arrhythmia Agents'),
(5, 'simvastatin', '54454', 'RYYVLZVUVIJVGH-UHFFFAOYSA-N', 'CCC(C)(C)C(=O)OC1CC(C=C2C1C(C(C=C2)C)CCC3CC(CC(=O)O3)O)C', 'Small molecule', 'Anticholesteremic Agents'),
(6, 'clarithromycin', '84029', 'AGOZJGHWCKAANG-UHFFFAOYSA-N', 'CCC1C(C(C(N(C)C)CC(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)(C)O)OC)C)O', 'Small molecule', 'Anti-Bacterial Agents'),
(7, 'metoprolol', '4171', 'ZOCUKGPVRNOCDT-UHFFFAOYSA-N', 'COCCC1=CC=C(C=C1)OCC(CNC(C)C)O', 'Small molecule', 'Adrenergic beta-Antagonists'),
(8, 'lisinopril', '5362119', 'RGHNJXZVMYPSQX-UHFFFAOYSA-N', 'C1CC(N(C1)C(=O)C(CCCCN)NC(CCC2=CC=CC=C2)C(=O)O)C(=O)O', 'Small molecule', 'Angiotensin-Converting Enzyme Inhibitors'),
(9, 'fluoxetine', '3386', 'RTHCYVBBDHJXIQ-UHFFFAOYSA-N', 'CNCCC(C1=CC=CC=C1)OC2=CC=C(C=C2)C(F)(F)F', 'Small molecule', 'Serotonin Uptake Inhibitors'),
(10, 'tramadol', '33741', 'HCHKCACWOHOZIP-UHFFFAOYSA-N', 'CN(C)CC(C1CCCCC1(C2=CC(=CC=C2)OC)O)C', 'Small molecule', 'Analgesics, Opioid');

-- Sync serial sequence
SELECT setval('drugs_drug_id_seq', (SELECT MAX(drug_id) FROM drugs));

-- ------------------------------------------------------------------------------
-- 2. SEED DRUG SOURCE MAPPINGS (PROVENANCE LINKS)
-- ------------------------------------------------------------------------------
INSERT INTO drug_source_mappings (drug_id, source_name, source_drug_id, source_drug_name, match_method) VALUES
(1, 'DDInter', 'DDInter1890', 'Warfarin', 'EXACT_NORMALIZED_NAME'),
(1, 'MecDDI', 'D1782', 'Warfarin', 'EXACT_NORMALIZED_NAME'),
(2, 'DDInter', 'DDInter122', 'Aspirin', 'EXACT_NORMALIZED_NAME'),
(2, 'MecDDI', 'D0089', 'Aspirin', 'EXACT_NORMALIZED_NAME'),
(3, 'DDInter', 'DDInter900', 'Ibuprofen', 'EXACT_NORMALIZED_NAME'),
(3, 'MecDDI', 'D0786', 'Ibuprofen', 'EXACT_NORMALIZED_NAME'),
(4, 'DDInter', 'DDInter84', 'Amiodarone', 'EXACT_NORMALIZED_NAME'),
(4, 'MecDDI', 'D0062', 'Amiodarone', 'EXACT_NORMALIZED_NAME'),
(5, 'DDInter', 'DDInter1654', 'Simvastatin', 'EXACT_NORMALIZED_NAME'),
(5, 'MecDDI', 'D1442', 'Simvastatin', 'EXACT_NORMALIZED_NAME'),
(6, 'DDInter', 'DDInter412', 'Clarithromycin', 'EXACT_NORMALIZED_NAME'),
(6, 'MecDDI', 'D0355', 'Clarithromycin', 'EXACT_NORMALIZED_NAME'),
(7, 'DDInter', 'DDInter1195', 'Metoprolol', 'EXACT_NORMALIZED_NAME'),
(7, 'MecDDI', 'D1047', 'Metoprolol', 'EXACT_NORMALIZED_NAME'),
(8, 'DDInter', 'DDInter1074', 'Lisinopril', 'EXACT_NORMALIZED_NAME'),
(8, 'MecDDI', 'D0941', 'Lisinopril', 'EXACT_NORMALIZED_NAME'),
(9, 'DDInter', 'DDInter760', 'Fluoxetine', 'EXACT_NORMALIZED_NAME'),
(9, 'MecDDI', 'D0670', 'Fluoxetine', 'EXACT_NORMALIZED_NAME'),
(10, 'DDInter', 'DDInter1809', 'Tramadol', 'EXACT_NORMALIZED_NAME'),
(10, 'MecDDI', 'D1594', 'Tramadol', 'EXACT_NORMALIZED_NAME');

-- ------------------------------------------------------------------------------
-- 3. SEED DDI PAIRS (CANONICAL UNORDERED PAIRS)
-- ------------------------------------------------------------------------------
INSERT INTO ddi_pairs (pair_id, drug_a_id, drug_b_id) VALUES
(1001, 1, 2),  -- Warfarin <-> Aspirin
(1002, 1, 3),  -- Warfarin <-> Ibuprofen
(1003, 1, 4),  -- Warfarin <-> Amiodarone
(1004, 4, 5),  -- Amiodarone <-> Simvastatin
(1005, 5, 6),  -- Simvastatin <-> Clarithromycin
(1006, 4, 7),  -- Amiodarone <-> Metoprolol
(1007, 2, 8),  -- Aspirin <-> Lisinopril
(1008, 9, 10), -- Fluoxetine <-> Tramadol
(1009, 7, 9);  -- Metoprolol <-> Fluoxetine

SELECT setval('ddi_pairs_pair_id_seq', (SELECT MAX(pair_id) FROM ddi_pairs));

-- ------------------------------------------------------------------------------
-- 4. SEED SEVERITIES (DDINTER)
-- ------------------------------------------------------------------------------
INSERT INTO ddi_severities (pair_id, severity_level, source_dataset, source_atc_codes) VALUES
(1001, 'Major', 'DDInter', 'B,N'),
(1002, 'Major', 'DDInter', 'B,M'),
(1003, 'Major', 'DDInter', 'B,C'),
(1004, 'Major', 'DDInter', 'C'),
(1005, 'Major', 'DDInter', 'C,J'),
(1006, 'Moderate', 'DDInter', 'C'),
(1007, 'Moderate', 'DDInter', 'B,C'),
(1008, 'Major', 'DDInter', 'N'),
(1009, 'Moderate', 'DDInter', 'C,N');

-- ------------------------------------------------------------------------------
-- 5. SEED MECHANISMS (MECDDI)
-- ------------------------------------------------------------------------------
INSERT INTO ddi_mechanisms (pair_id, mechanism_category, source_dataset) VALUES
(1001, 'Pharmacodynamic additive effects', 'MecDDI'),
(1002, 'Pharmacodynamic additive effects', 'MecDDI'),
(1002, 'Affected intra_extra-hepatic metabolism', 'MecDDI'),
(1003, 'Affected intra_extra-hepatic metabolism', 'MecDDI'),
(1004, 'Affected intra_extra-hepatic metabolism', 'MecDDI'),
(1005, 'Affected cellular transport', 'MecDDI'),
(1005, 'Affected intra_extra-hepatic metabolism', 'MecDDI'),
(1006, 'Pharmacodynamic additive effects', 'MecDDI'),
(1007, 'Affected excretion pathways', 'MecDDI'),
(1008, 'Pharmacodynamic additive effects', 'MecDDI'),
(1008, 'Affected intra_extra-hepatic metabolism', 'MecDDI'),
(1009, 'Affected intra_extra-hepatic metabolism', 'MecDDI');

-- ------------------------------------------------------------------------------
-- 6. SEED SYNTHETIC PATIENTS
-- ------------------------------------------------------------------------------
INSERT INTO patients (patient_id, mrn, full_name, gender, date_of_birth, primary_condition, is_synthetic) VALUES
(1, 'SYN-PAT-1001', 'Robert Vance', 'Male', '1958-03-14', 'Atrial Fibrillation & Hyperlipidemia', TRUE),
(2, 'SYN-PAT-1002', 'Eleanor Wright', 'Female', '1964-07-22', 'Osteoarthritis & Major Depressive Disorder', TRUE),
(3, 'SYN-PAT-1003', 'Marcus Chen', 'Male', '1972-11-05', 'Hypertension & Coronary Artery Disease', TRUE),
(4, 'SYN-PAT-1004', 'Sarah Jenkins', 'Female', '1980-09-18', 'Hypercholesterolemia & Acute Infection', TRUE);

SELECT setval('patients_patient_id_seq', (SELECT MAX(patient_id) FROM patients));

-- ------------------------------------------------------------------------------
-- 7. SEED SYNTHETIC PRESCRIPTIONS
-- ------------------------------------------------------------------------------
INSERT INTO prescriptions (patient_id, drug_id, dosage, frequency, status, prescribed_by, start_date) VALUES
-- Patient 1: Robert Vance (Warfarin + Amiodarone + Simvastatin)
-- Direct interactions: (1,4), (4,5). 2-Hop Candidate Pathway: Warfarin -> Amiodarone -> Simvastatin!
(1, 1, '5mg', 'Once daily in evening', 'ACTIVE', 'dr_sharma', '2026-01-15'),
(1, 4, '200mg', 'Once daily', 'ACTIVE', 'dr_sharma', '2026-02-01'),
(1, 5, '40mg', 'Once daily at bedtime', 'ACTIVE', 'dr_sharma', '2026-02-10'),

-- Patient 2: Eleanor Wright (Fluoxetine + Tramadol + Ibuprofen)
-- Major Direct Interactions: (9,10) Serotonin toxicity; (1,3) additive risk
(2, 9, '20mg', 'Once daily in morning', 'ACTIVE', 'dr_sharma', '2026-03-01'),
(2, 10, '50mg', 'Every 6 hours as needed for severe pain', 'ACTIVE', 'dr_sharma', '2026-03-15'),
(2, 3, '400mg', 'Twice daily with food', 'ACTIVE', 'dr_sharma', '2026-04-01'),

-- Patient 3: Marcus Chen (Lisinopril + Metoprolol + Aspirin)
-- Direct Interactions: (2,8) Aspirin-Lisinopril
(3, 8, '10mg', 'Once daily', 'ACTIVE', 'dr_sharma', '2026-01-10'),
(3, 7, '50mg', 'Once daily', 'ACTIVE', 'dr_sharma', '2026-01-10'),
(3, 2, '81mg', 'Once daily', 'ACTIVE', 'dr_sharma', '2026-01-10'),

-- Patient 4: Sarah Jenkins (Simvastatin + Clarithromycin)
-- Major Direct Interaction: (5,6) Severe CYP/transporter inhibition
(4, 5, '20mg', 'Once daily', 'ACTIVE', 'dr_sharma', '2026-04-10'),
(4, 6, '500mg', 'Twice daily for 10 days', 'ACTIVE', 'dr_sharma', '2026-04-12');

SELECT setval('prescriptions_prescription_id_seq', (SELECT MAX(prescription_id) FROM prescriptions));

-- ------------------------------------------------------------------------------
-- 8. SEED USER ACCOUNTS (AUTHENTICATION & RBAC)
-- ------------------------------------------------------------------------------
-- Pre-hashed passwords for development demonstration:
-- admin -> 'Admin@123'
-- dr_sharma -> 'Doctor@123'
INSERT INTO user_accounts (user_id, username, password_hash, full_name, role, is_active) VALUES
(1, 'admin', '$2b$10$B26dhZyVfX0XHvNtxofhIu3earkdclpsI2KQ6/cbSicnjjJQVQt2a', 'System Administrator', 'ADMIN', TRUE),
(2, 'dr_sharma', '$2b$10$B26dhZyVfX0XHvNtxofhIuFNIXdPraLWZarK4ufY15U1D/ez9WZ8O', 'Dr. Ramesh Sharma, MD', 'DOCTOR', TRUE);

SELECT setval('user_accounts_user_id_seq', (SELECT MAX(user_id) FROM user_accounts));
