import { query } from './client';

export interface Prescription {
  prescription_id: number;
  patient_id: number;
  drug_id: number;
  canonical_name: string;
  dosage: string;
  frequency: string;
  status: 'ACTIVE' | 'DISCONTINUED' | 'COMPLETED';
  start_date: string;
  end_date: string | null;
  prescribed_by: string;
}

export interface DrugOption {
  drug_id: number;
  canonical_name: string;
  therapeutic_class: string | null;
}

export async function getAllDrugs(): Promise<DrugOption[]> {
  const sql = `
    SELECT drug_id, canonical_name, therapeutic_class
    FROM drugs
    ORDER BY canonical_name ASC;
  `;
  const res = await query<DrugOption>(sql, [], 'DOCTOR');
  return res.rows;
}

export async function createPrescription(data: {
  patientId: number;
  drugId: number;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate?: string;
}): Promise<Prescription> {
  const sql = `
    INSERT INTO prescriptions (
      patient_id, drug_id, dosage, frequency, status, prescribed_by, start_date
    ) VALUES (
      $1, $2, $3, $4, 'ACTIVE', $5, COALESCE($6::DATE, CURRENT_DATE)
    )
    RETURNING 
      prescription_id, patient_id, drug_id, dosage, frequency, status, 
      start_date::TEXT, end_date::TEXT, prescribed_by;
  `;
  const res = await query<Omit<Prescription, 'canonical_name'>>(sql, [
    data.patientId,
    data.drugId,
    data.dosage.trim(),
    data.frequency.trim(),
    data.prescribedBy.trim(),
    data.startDate || null,
  ], 'DOCTOR');

  const pres = res.rows[0];
  const drugRes = await query<{ canonical_name: string }>(
    `SELECT canonical_name FROM drugs WHERE drug_id = $1;`,
    [pres.drug_id],
    'DOCTOR'
  );

  return {
    ...pres,
    canonical_name: drugRes.rows[0]?.canonical_name || 'Unknown',
  };
}

export async function updatePrescriptionDosage(
  prescriptionId: number,
  dosage: string,
  frequency?: string
): Promise<Prescription | null> {
  const sql = `
    UPDATE prescriptions
    SET 
      dosage = $2,
      frequency = COALESCE($3, frequency)
    WHERE prescription_id = $1
    RETURNING 
      prescription_id, patient_id, drug_id, dosage, frequency, status, 
      start_date::TEXT, end_date::TEXT, prescribed_by;
  `;
  const res = await query<Omit<Prescription, 'canonical_name'>>(sql, [
    prescriptionId,
    dosage.trim(),
    frequency?.trim() || null,
  ], 'DOCTOR');

  const pres = res.rows[0];
  if (!pres) return null;

  const drugRes = await query<{ canonical_name: string }>(
    `SELECT canonical_name FROM drugs WHERE drug_id = $1;`,
    [pres.drug_id],
    'DOCTOR'
  );

  return {
    ...pres,
    canonical_name: drugRes.rows[0]?.canonical_name || 'Unknown',
  };
}

export async function discontinuePrescription(prescriptionId: number): Promise<boolean> {
  const sql = `
    UPDATE prescriptions
    SET status = 'DISCONTINUED', end_date = CURRENT_DATE
    WHERE prescription_id = $1;
  `;
  const res = await query(sql, [prescriptionId], 'DOCTOR');
  return (res.rowCount || 0) > 0;
}

export async function deletePrescription(prescriptionId: number): Promise<boolean> {
  const sql = `DELETE FROM prescriptions WHERE prescription_id = $1;`;
  const res = await query(sql, [prescriptionId], 'ADMIN');
  return (res.rowCount || 0) > 0;
}
