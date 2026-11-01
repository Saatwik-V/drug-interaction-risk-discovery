import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres/client';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const SHOWCASE_QUERIES: Record<
  number,
  {
    title: string;
    rubricMarks: string;
    category: string;
    sql: string;
    explanation: string;
  }
> = {
  1: {
    title: 'Multi-Table LEFT OUTER JOIN with Aggregation',
    rubricMarks: 'Joins: Inner, Outer & Self-Joins (4 Marks)',
    category: 'JOINS',
    sql: `SELECT 
    da.canonical_name AS drug_a,
    db.canonical_name AS drug_b,
    COALESCE(ds.severity_level, 'Not Reported') AS severity,
    COALESCE(string_agg(DISTINCT dm.mechanism_category, '; '), 'General Interaction') AS mechanism_categories,
    dp.created_at::TEXT
FROM ddi_pairs dp
JOIN drugs da ON dp.drug_a_id = da.drug_id
JOIN drugs db ON dp.drug_b_id = db.drug_id
LEFT JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
LEFT JOIN ddi_mechanisms dm ON dp.pair_id = dm.pair_id
GROUP BY da.canonical_name, db.canonical_name, ds.severity_level, dp.created_at
ORDER BY da.canonical_name;`,
    explanation:
      'Harmonizes documented interaction pairs across heterogeneous sources (DDInter for severity and MecDDI for mechanism) using multi-table LEFT OUTER JOINs with string_agg.',
  },
  2: {
    title: 'SELF-JOIN on Prescriptions (Unordered Patient Medication Pairs)',
    rubricMarks: 'Joins: Inner, Outer & Self-Joins (4 Marks)',
    category: 'JOINS',
    sql: `SELECT 
    p.full_name AS patient_name,
    d1.canonical_name AS drug_1,
    d2.canonical_name AS drug_2
FROM prescriptions pr1
JOIN prescriptions pr2 ON pr1.patient_id = pr2.patient_id AND pr1.drug_id < pr2.drug_id
JOIN patients p ON pr1.patient_id = p.patient_id
JOIN drugs d1 ON pr1.drug_id = d1.drug_id
JOIN drugs d2 ON pr2.drug_id = d2.drug_id
WHERE pr1.status = 'ACTIVE' AND pr2.status = 'ACTIVE' AND pr1.patient_id = 1;`,
    explanation:
      'Generates all unique unordered 2-drug combinations (N choose 2) within Patient 1 active medication regimen using a Self-Join with pr1.drug_id < pr2.drug_id.',
  },
  3: {
    title: 'Correlated Subquery with EXISTS',
    rubricMarks: 'Nested and Correlated Queries (4 Marks)',
    category: 'SUBQUERIES',
    sql: `SELECT d.drug_id, d.canonical_name, d.therapeutic_class
FROM drugs d
WHERE EXISTS (
    SELECT 1 
    FROM ddi_pairs dp
    JOIN ddi_severities ds ON dp.pair_id = ds.pair_id
    WHERE (dp.drug_a_id = d.drug_id OR dp.drug_b_id = d.drug_id)
      AND ds.severity_level = 'Major'
);`,
    explanation:
      'Correlated subquery evaluating whether the current outer drug row is involved in at least one documented Major clinical severity interaction.',
  },
  4: {
    title: 'Nested Subquery with IN & UNION',
    rubricMarks: 'Nested and Correlated Queries (4 Marks)',
    category: 'SUBQUERIES',
    sql: `SELECT p.patient_id, p.mrn, p.full_name, p.primary_condition
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
);`,
    explanation:
      'Multi-level nested subquery discovering patients taking any medication known to alter hepatic metabolism enzymes.',
  },
  5: {
    title: 'Window Function: DENSE_RANK() & Relative Percentage',
    rubricMarks: 'Window Functions & Aggregates (4 Marks)',
    category: 'ANALYTICS',
    sql: `SELECT 
    dm.mechanism_category,
    COUNT(dm.pair_id) AS occurrence_count,
    DENSE_RANK() OVER (ORDER BY COUNT(dm.pair_id) DESC) AS popularity_rank,
    ROUND(COUNT(dm.pair_id) * 100.0 / SUM(COUNT(dm.pair_id)) OVER (), 2) AS percentage_of_total
FROM ddi_mechanisms dm
GROUP BY dm.mechanism_category;`,
    explanation:
      'Analytical window ranking without collapsing rows, calculating both dense popularity rankings and cumulative database market share per mechanism.',
  },
  6: {
    title: 'Window Function: PARTITION BY & ROW_NUMBER()',
    rubricMarks: 'Window Functions & Aggregates (4 Marks)',
    category: 'ANALYTICS',
    sql: `SELECT 
    p.full_name,
    d.canonical_name AS drug_name,
    pr.start_date::TEXT,
    ROW_NUMBER() OVER (PARTITION BY pr.patient_id ORDER BY pr.start_date DESC) AS recency_order
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.patient_id
JOIN drugs d ON pr.drug_id = d.drug_id;`,
    explanation:
      'Computes sequential order of prescriptions partitioned by patient without row loss, identifying the most recently ordered medications.',
  },
  7: {
    title: 'RECURSIVE CTE: 2-Hop Graph Traversal in Relational SQL',
    rubricMarks: 'Advanced CTEs & Graph Traversal (4 Marks)',
    category: 'CTEs',
    sql: `WITH RECURSIVE GraphPaths AS (
    -- Anchor member: Direct (1-hop) edges from start drug (Warfarin, ID=1)
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
WHERE gp.depth = 2 AND d_end.canonical_name = 'simvastatin';`,
    explanation:
      'Implements a recursive graph traversal algorithm in PostgreSQL using RECURSIVE Common Table Expressions. Traverses Warfarin -> Amiodarone (bridge) -> Simvastatin, proving multi-hop capabilities directly within relational SQL.',
  },
};

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    return NextResponse.json({
      success: true,
      queries: Object.entries(SHOWCASE_QUERIES).map(([id, q]) => ({
        id: Number(id),
        title: q.title,
        rubricMarks: q.rubricMarks,
        category: q.category,
        sql: q.sql,
        explanation: q.explanation,
      })),
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const body = await request.json();
    const queryId = parseInt(body?.queryId || '1', 10);

    const queryConfig = SHOWCASE_QUERIES[queryId];
    if (!queryConfig) {
      return NextResponse.json({ success: false, error: 'Invalid query ID.' }, { status: 400 });
    }

    const startTime = Date.now();
    const res = await query(queryConfig.sql, [], 'DOCTOR');
    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      queryId,
      title: queryConfig.title,
      rubricMarks: queryConfig.rubricMarks,
      category: queryConfig.category,
      sql: queryConfig.sql,
      executionMs,
      rowsReturned: res.rows.length,
      data: res.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
