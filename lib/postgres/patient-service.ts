import { query, getPostgresPool } from './client';

export interface Patient {
  patient_id: number;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  is_synthetic: boolean;
  active_medication_count?: number;
}

export interface PrescriptionWithDrug {
  prescription_id: number;
  patient_id: number;
  drug_id: number;
  canonical_name: string;
  therapeutic_class: string | null;
  dosage: string;
  frequency: string;
  status: string;
  start_date: string;
  end_date: string | null;
  prescribed_by: string;
}

export interface DirectInteractionResult {
  pair_id: number;
  drug_a_id: number;
  drug_a_name: string;
  drug_b_id: number;
  drug_b_name: string;
  severity_level: string;
  mechanism_categories: string | null;
  evidence_sources: string;
}

export async function getAllPatients(): Promise<Patient[]> {
  const sql = `
    SELECT 
      p.patient_id,
      p.mrn,
      p.full_name,
      p.date_of_birth::TEXT,
      p.gender,
      p.is_synthetic,
      COUNT(pr.prescription_id) FILTER (WHERE pr.status = 'ACTIVE') AS active_medication_count
    FROM patients p
    LEFT JOIN prescriptions pr ON pr.patient_id = p.patient_id
    GROUP BY p.patient_id, p.mrn, p.full_name, p.date_of_birth, p.gender, p.is_synthetic
    ORDER BY p.patient_id ASC;
  `;
  const res = await query<Patient>(sql);
  return res.rows.map((r) => ({
    ...r,
    active_medication_count: Number(r.active_medication_count || 0),
  }));
}

export async function getPatientById(patientId: number): Promise<Patient | null> {
  const sql = `
    SELECT 
      patient_id,
      mrn,
      full_name,
      date_of_birth::TEXT,
      gender,
      is_synthetic
    FROM patients
    WHERE patient_id = $1;
  `;
  const res = await query<Patient>(sql, [patientId]);
  return res.rows[0] || null;
}

export async function getActivePrescriptions(patientId: number): Promise<PrescriptionWithDrug[]> {
  const sql = `
    SELECT 
      pr.prescription_id,
      pr.patient_id,
      pr.drug_id,
      d.canonical_name,
      d.therapeutic_class,
      pr.dosage,
      pr.frequency,
      pr.status,
      pr.start_date::TEXT,
      pr.end_date::TEXT,
      pr.prescribed_by
    FROM prescriptions pr
    JOIN drugs d ON d.drug_id = pr.drug_id
    WHERE pr.patient_id = $1 AND pr.status = 'ACTIVE'
    ORDER BY pr.start_date DESC;
  `;
  const res = await query<PrescriptionWithDrug>(sql, [patientId]);
  return res.rows;
}

export async function getDirectInteractionsForDrugs(
  drugIds: number[]
): Promise<DirectInteractionResult[]> {
  if (drugIds.length < 2) {
    return [];
  }

  const sql = `
    SELECT 
      dp.pair_id,
      dp.drug_a_id,
      da.canonical_name AS drug_a_name,
      dp.drug_b_id,
      db.canonical_name AS drug_b_name,
      COALESCE(ds.severity_level, 'Unknown') AS severity_level,
      STRING_AGG(DISTINCT dm.mechanism_category, '; ') AS mechanism_categories,
      CASE 
        WHEN ds.severity_level IS NOT NULL AND COUNT(dm.mechanism_category) > 0 THEN 'DDInter+MecDDI'
        WHEN ds.severity_level IS NOT NULL THEN 'DDInter'
        ELSE 'MecDDI'
      END AS evidence_sources
    FROM ddi_pairs dp
    JOIN drugs da ON da.drug_id = dp.drug_a_id
    JOIN drugs db ON db.drug_id = dp.drug_b_id
    LEFT JOIN ddi_severities ds ON ds.pair_id = dp.pair_id
    LEFT JOIN ddi_mechanisms dm ON dm.pair_id = dp.pair_id
    WHERE dp.drug_a_id = ANY($1::int[]) AND dp.drug_b_id = ANY($1::int[])
    GROUP BY dp.pair_id, dp.drug_a_id, da.canonical_name, dp.drug_b_id, db.canonical_name, ds.severity_level
    ORDER BY dp.pair_id ASC;
  `;
  const res = await query<DirectInteractionResult>(sql, [drugIds]);
  return res.rows;
}

export interface FindingToInsert {
  drug_a_id: number;
  drug_b_id: number;
  hop_count: number;
  traversal_path: string;
  severity_level: string | null;
  mechanism_category: string | null;
  evidence_sources: string;
  finding_type: 'DOCUMENTED_DIRECT' | 'CANDIDATE_PATHWAY';
}

export async function persistAssessmentWithFindings(
  patientId: number,
  doctorUsername: string,
  totalActiveMeds: number,
  maxHopDepth: number,
  notes: string,
  findings: FindingToInsert[]
): Promise<number> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert assessment header
    const insertHeaderSql = `
      INSERT INTO risk_assessments (
        patient_id, performed_by, max_hop_depth, total_active_medications, assessment_notes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING assessment_id;
    `;
    const headerRes = await client.query(insertHeaderSql, [
      patientId,
      doctorUsername,
      maxHopDepth,
      totalActiveMeds,
      notes,
    ]);
    const assessmentId: number = parseInt(headerRes.rows[0].assessment_id, 10);

    // 2. Insert granular findings (Trigger trg_assessment_findings_count will update counts)
    const insertFindingSql = `
      INSERT INTO assessment_findings (
        assessment_id, drug_a_id, drug_b_id, hop_count, traversal_path,
        severity_level, mechanism_category, evidence_sources, finding_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `;

    for (const f of findings) {
      await client.query(insertFindingSql, [
        assessmentId,
        f.drug_a_id,
        f.drug_b_id,
        f.hop_count,
        f.traversal_path,
        f.severity_level,
        f.mechanism_category,
        f.evidence_sources,
        f.finding_type,
      ]);
    }

    await client.query('COMMIT');
    return assessmentId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
