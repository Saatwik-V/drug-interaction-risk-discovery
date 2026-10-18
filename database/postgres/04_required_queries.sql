-- ==============================================================================
-- 04_required_queries.sql
-- Evaluated SQL Operations, Joins, Nested Queries, CTEs, and Advanced Database Concepts
-- Patient-Specific Multi-Hop Drug Interaction Risk Discovery
-- PES University DBMS Level 3 Rubric Alignment
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DML OPERATIONS (RUBRIC: 4 MARKS)
-- ------------------------------------------------------------------------------

-- 1.1 INSERT: Prescribe a new medication to a synthetic patient
INSERT INTO prescriptions (patient_id, drug_id, dosage, frequency, status, prescribed_by, start_date)
VALUES (1, 8, '10mg', 'Once daily', 'ACTIVE', 'dr_sharma', CURRENT_DATE);

-- 1.2 SELECT with Multi-Table Joins & Filter
SELECT 
    p.full_name AS patient_name,
    d.canonical_name AS prescribed_drug,
    pr.dosage,
    pr.frequency,
    pr.status
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.patient_id
JOIN drugs d ON pr.drug_id = d.drug_id
WHERE pr.status = 'ACTIVE' AND p.patient_id = 1;

-- 1.3 UPDATE: Modify dosage of an existing active prescription
UPDATE prescriptions
SET dosage = '7.5mg', frequency = 'Once daily at 6 PM'
WHERE patient_id = 1 AND drug_id = 1 AND status = 'ACTIVE';

-- 1.4 DELETE (Soft / Controlled): Discontinue a prescription regimen
UPDATE prescriptions
SET status = 'DISCONTINUED', end_date = CURRENT_DATE
WHERE patient_id = 1 AND drug_id = 8;

-- ------------------------------------------------------------------------------
-- 2. JOINS: INNER, LEFT OUTER, AND SELF-JOINS (RUBRIC: 4 MARKS)
-- ------------------------------------------------------------------------------

-- 2.1 Multi-Table LEFT JOIN to retrieve Interaction Pairs with both Severity and Mechanisms
SELECT 
    da.canonical_name AS drug_a,
    db.canonical_name AS drug_b,
    COALESCE(ds.severity_level, 'Not Reported') AS severity,
    COALESCE(string_agg(DISTINCT dm.mechanism_category, '; '), 'General Interaction') AS mechanism_categories,
    dp.created_at
FROM ddi_pairs dp
JOIN drugs da ON dp.drug_a_id = da.drug_id
JOIN drugs db ON dp.drug_b_id = db.drug_id
LEFT JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
LEFT JOIN ddi_mechanisms dm ON dp.pair_id = dm.pair_id
GROUP BY da.canonical_name, db.canonical_name, ds.severity_level, dp.created_at
ORDER BY da.canonical_name;

-- 2.2 SELF-JOIN on Prescriptions: Generate all unordered medication pairs within a patient regimen
SELECT 
    p.full_name AS patient_name,
    d1.canonical_name AS drug_1,
    d2.canonical_name AS drug_2
FROM prescriptions pr1
JOIN prescriptions pr2 ON pr1.patient_id = pr2.patient_id AND pr1.drug_id < pr2.drug_id
JOIN patients p ON pr1.patient_id = p.patient_id
JOIN drugs d1 ON pr1.drug_id = d1.drug_id
JOIN drugs d2 ON pr2.drug_id = d2.drug_id
WHERE pr1.status = 'ACTIVE' AND pr2.status = 'ACTIVE' AND pr1.patient_id = 1;

-- ------------------------------------------------------------------------------
-- 3. NESTED AND CORRELATED QUERIES (RUBRIC: 4 MARKS)
-- ------------------------------------------------------------------------------

-- 3.1 Correlated Subquery with EXISTS: Find all drugs that have at least one 'Major' interaction
SELECT d.drug_id, d.canonical_name, d.therapeutic_class
FROM drugs d
WHERE EXISTS (
    SELECT 1 
    FROM ddi_pairs dp
    JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
    WHERE (dp.drug_a_id = d.drug_id OR dp.drug_b_id = d.drug_id)
      AND ds.severity_level = 'Major'
);

-- 3.2 Nested Subquery with IN: Find patients who are actively taking any drug involved in a metabolic interaction
SELECT p.patient_id, p.mrn, p.full_name, p.primary_condition
FROM patients p
WHERE p.patient_id IN (
    SELECT pr.patient_id
    FROM prescriptions pr
    WHERE pr.status = 'ACTIVE' AND pr.drug_id IN (
        SELECT dp.drug_a_id FROM ddi_pairs dp
        JOIN ddi_mechanisms dm ON dp.pair_id = dm.pair_id
        WHERE dm.mechanism_category = 'Affected intra_extra-hepatic metabolism'
        UNION
        SELECT dp.drug_b_id FROM ddi_pairs dp
        JOIN ddi_mechanisms dm ON dp.pair_id = dm.pair_id
        WHERE dm.mechanism_category = 'Affected intra_extra-hepatic metabolism'
    )
);

-- 3.3 Correlated Subquery with NOT EXISTS: Find drugs that have never been prescribed to any patient
SELECT d.drug_id, d.canonical_name, d.therapeutic_class
FROM drugs d
WHERE NOT EXISTS (
    SELECT 1 FROM prescriptions pr WHERE pr.drug_id = d.drug_id
);

-- ------------------------------------------------------------------------------
-- 4. AGGREGATES, GROUP BY, AND HAVING (RUBRIC: 4 MARKS)
-- ------------------------------------------------------------------------------

-- 4.1 Count interactions per drug with HAVING filter
SELECT 
    d.canonical_name,
    COUNT(dp.pair_id) AS total_documented_interactions,
    COUNT(CASE WHEN ds.severity_level = 'Major' THEN 1 END) AS major_count,
    COUNT(CASE WHEN ds.severity_level = 'Moderate' THEN 1 END) AS moderate_count
FROM drugs d
JOIN ddi_pairs dp ON d.drug_id = dp.drug_a_id OR d.drug_id = dp.drug_b_id
LEFT JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
GROUP BY d.drug_id, d.canonical_name
HAVING COUNT(dp.pair_id) >= 2
ORDER BY total_documented_interactions DESC;

-- ------------------------------------------------------------------------------
-- 5. WINDOW FUNCTIONS (ANALYTICAL SQL)
-- ------------------------------------------------------------------------------

-- 5.1 Rank mechanism categories by frequency of occurrence across interaction pairs
SELECT 
    dm.mechanism_category,
    COUNT(dm.pair_id) AS occurrence_count,
    DENSE_RANK() OVER (ORDER BY COUNT(dm.pair_id) DESC) AS popularity_rank,
    ROUND(COUNT(dm.pair_id) * 100.0 / SUM(COUNT(dm.pair_id)) OVER (), 2) AS percentage_of_total
FROM ddi_mechanisms dm
GROUP BY dm.mechanism_category;

-- 5.2 Row Number partitioning for latest prescription per patient
SELECT 
    p.full_name,
    d.canonical_name AS drug_name,
    pr.start_date,
    ROW_NUMBER() OVER (PARTITION BY pr.patient_id ORDER BY pr.start_date DESC) AS recency_order
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.patient_id
JOIN drugs d ON pr.drug_id = d.drug_id;

-- ------------------------------------------------------------------------------
-- 6. COMMON TABLE EXPRESSIONS (CTEs) & RECURSIVE SQL GRAPH TRAVERSAL
-- ------------------------------------------------------------------------------

-- 6.1 Multi-Stage CTE: Screening Patient Active Regimens against Severity Database
WITH PatientRegimen AS (
    SELECT pr.patient_id, pr.drug_id, d.canonical_name
    FROM prescriptions pr
    JOIN drugs d ON pr.drug_id = d.drug_id
    WHERE pr.status = 'ACTIVE' AND pr.patient_id = 1
),
ActivePairs AS (
    SELECT 
        r1.drug_id AS id_a, r1.canonical_name AS name_a,
        r2.drug_id AS id_b, r2.canonical_name AS name_b
    FROM PatientRegimen r1
    JOIN PatientRegimen r2 ON r1.drug_id < r2.drug_id
)
SELECT 
    ap.name_a,
    ap.name_b,
    COALESCE(ds.severity_level, 'No Direct Interaction') AS severity_status
FROM ActivePairs ap
LEFT JOIN ddi_pairs dp ON ap.id_a = dp.drug_a_id AND ap.id_b = dp.drug_b_id
LEFT JOIN ddi_severities ds ON dp.pair_id = ds.pair_id;

-- 6.2 RECURSIVE CTE: Bounded 2-Hop Graph Traversal in Relational SQL
-- Demonstrates multi-hop path traversal in PostgreSQL to contrast with Neo4j graph traversal!
WITH RECURSIVE GraphPaths AS (
    -- Anchor member: Direct (1-hop) edges from start drug (e.g., Warfarin, ID=1)
    SELECT 
        dp.drug_a_id AS current_drug_id,
        dp.drug_b_id AS next_drug_id,
        1 AS depth,
        ARRAY[dp.drug_a_id, dp.drug_b_id] AS path_nodes
    FROM ddi_pairs dp
    WHERE dp.drug_a_id = 1
    
    UNION ALL
    
    SELECT 
        dp.drug_b_id AS current_drug_id,
        dp.drug_a_id AS next_drug_id,
        1 AS depth,
        ARRAY[dp.drug_b_id, dp.drug_a_id] AS path_nodes
    FROM ddi_pairs dp
    WHERE dp.drug_b_id = 1

    UNION ALL

    -- Recursive member: Extend path to depth 2 (2-hop paths)
    SELECT 
        gp.next_drug_id AS current_drug_id,
        CASE 
            WHEN dp.drug_a_id = gp.next_drug_id THEN dp.drug_b_id 
            ELSE dp.drug_a_id 
        END AS next_drug_id,
        gp.depth + 1 AS depth,
        gp.path_nodes || CASE 
            WHEN dp.drug_a_id = gp.next_drug_id THEN dp.drug_b_id 
            ELSE dp.drug_a_id 
        END AS path_nodes
    FROM GraphPaths gp
    JOIN ddi_pairs dp ON dp.drug_a_id = gp.next_drug_id OR dp.drug_b_id = gp.next_drug_id
    WHERE gp.depth < 2 
      AND NOT (CASE WHEN dp.drug_a_id = gp.next_drug_id THEN dp.drug_b_id ELSE dp.drug_a_id END = ANY(gp.path_nodes))
)
SELECT 
    d_start.canonical_name AS start_drug,
    d_mid.canonical_name AS bridge_drug,
    d_end.canonical_name AS target_candidate,
    gp.depth AS hop_count
FROM GraphPaths gp
JOIN drugs d_start ON d_start.drug_id = gp.path_nodes[1]
JOIN drugs d_mid ON d_mid.drug_id = gp.path_nodes[2]
JOIN drugs d_end ON d_end.drug_id = gp.path_nodes[3]
WHERE gp.depth = 2 AND d_end.canonical_name = 'simvastatin';
-- Notice that this returns: start: warfarin -> bridge: amiodarone -> target: simvastatin!
