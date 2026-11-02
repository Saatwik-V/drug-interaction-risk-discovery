'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AddPrescriptionModal from '@/components/modals/AddPrescriptionModal';
import InteractionGraphViewer from '@/components/graph/InteractionGraphViewer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import VerifyOnDisk from '@/components/ui/VerifyOnDisk';
import { useToast } from '@/components/ui/Toast';

interface Patient {
  patient_id: number;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  is_synthetic: boolean;
  primary_condition?: string | null;
}

interface Prescription {
  prescription_id: number;
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

interface DirectInteraction {
  pair_id: number;
  drug_a_id: number;
  drug_a_name: string;
  drug_b_id: number;
  drug_b_name: string;
  severity_level: string;
  mechanism_categories: string | null;
  evidence_sources: string;
}

interface CandidatePathway {
  drug_a_id: number;
  drug_a_name: string;
  drug_b_id: number;
  drug_b_name: string;
  hop_count: number;
  nodes: string[];
  node_ids: number[];
  edge_severities: string[];
  edge_mechanisms: string[][];
  edge_sources: string[];
  bridge_drugs: string[];
  finding_type: 'CANDIDATE_PATHWAY';
}

interface AssessmentData {
  assessment_id: number | null;
  patient: Patient;
  active_prescriptions: Prescription[];
  summary: {
    total_active_medications: number;
    direct_interaction_count: number;
    multi_hop_candidate_count: number;
    max_severity_found: string;
    max_hop_depth_searched: number;
  };
  direct_findings: DirectInteraction[];
  multi_hop_candidates: CandidatePathway[];
  scientific_disclaimer: string;
}

function severityBadgeClass(severity: string): string {
  const s = severity?.toLowerCase();
  if (s === 'major' || s === 'critical') return 'badge-major';
  if (s === 'moderate') return 'badge-moderate';
  if (s === 'minor') return 'badge-minor';
  return 'badge-unknown';
}

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params?.id as string;
  const { addToast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [isAddRxModalOpen, setIsAddRxModalOpen] = useState(false);
  const [pendingDiscontinue, setPendingDiscontinue] = useState<{ id: number; name: string } | null>(null);
  const [discontinueLoading, setDiscontinueLoading] = useState(false);
  const [maxHopDepth, setMaxHopDepth] = useState(3);
  const [currentUserRole, setCurrentUserRole] = useState<'DOCTOR' | 'ADMIN' | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<{ id: number; name: string } | null>(null);
  const [hardDeleteLoading, setHardDeleteLoading] = useState(false);

  // Patient demographics edit (PUT /api/patients/[id]) — previously real and
  // working server-side, but with no button anywhere to reach it.
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editPrimaryCondition, setEditPrimaryCondition] = useState('');
  const [editPatientLoading, setEditPatientLoading] = useState(false);

  // Editable dosage state
  const [editingRxId, setEditingRxId] = useState<number | null>(null);
  const [editDosageValue, setEditDosageValue] = useState('');

  const loadPatientData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Patient record ID #${patientId} was not found in the database.`);
        }
        throw new Error('Failed to load patient records.');
      }
      const data = await res.json();
      if (data.success && data.data) {
        setPatient(data.data.patient);
        setPrescriptions(data.data.active_prescriptions || []);
      } else {
        throw new Error(data.error || 'Failed to parse patient response.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with database services.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  // Determines whether the ADMIN-only hard-delete action on prescriptions is
  // shown — the backend already enforces this via requireRole(['ADMIN']),
  // this is purely so a DOCTOR never sees a button that would just 403.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCurrentUserRole(d.user.role);
      })
      .catch(() => {});
  }, []);

  const handleRunScreening = async () => {
    if (!patientId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/analyze-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxHopDepth,
          notes: assessmentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Interaction risk analysis failed.');
      }

      setAssessment(data.data);
      addToast({
        type: 'success',
        title: 'Risk Discovery Completed',
        message: `Found ${data.data.summary.direct_interaction_count} direct and ${data.data.summary.multi_hop_candidate_count} multi-hop candidate paths.`,
      });
    } catch (err: any) {
      setError(err.message || 'Error occurred during cross-database risk evaluation.');
      addToast({
        type: 'error',
        title: 'Screening Failed',
        message: err.message,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateDosage = async (rxId: number) => {
    if (!editDosageValue.trim()) return;
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: rxId,
          dosage: editDosageValue.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Dosage Updated (DML)',
          message: data.message,
        });
        setEditingRxId(null);
        loadPatientData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleDiscontinueRx = (rxId: number, drugName: string) => {
    setPendingDiscontinue({ id: rxId, name: drugName });
  };

  const confirmDiscontinueRx = async () => {
    if (!pendingDiscontinue) return;
    setDiscontinueLoading(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: pendingDiscontinue.id,
          action: 'DISCONTINUE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'info',
          title: 'Prescription Discontinued',
          message: data.message,
        });
        loadPatientData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setDiscontinueLoading(false);
      setPendingDiscontinue(null);
    }
  };

  const handleHardDeleteRx = (rxId: number, drugName: string) => {
    setPendingHardDelete({ id: rxId, name: drugName });
  };

  const confirmHardDeleteRx = async () => {
    if (!pendingHardDelete) return;
    setHardDeleteLoading(true);
    try {
      const res = await fetch(`/api/prescriptions?prescription_id=${pendingHardDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'info',
          title: 'Prescription Hard-Deleted',
          message: data.message,
        });
        loadPatientData();
      } else {
        addToast({ type: 'error', title: 'Delete Failed', message: data.error });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setHardDeleteLoading(false);
      setPendingHardDelete(null);
    }
  };

  const openEditPatient = () => {
    if (!patient) return;
    setEditFullName(patient.full_name);
    setEditGender(patient.gender);
    setEditDateOfBirth(patient.date_of_birth);
    setEditPrimaryCondition(patient.primary_condition || '');
    setIsEditingPatient(true);
  };

  const saveEditPatient = async () => {
    if (!patientId) return;
    setEditPatientLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          gender: editGender,
          dateOfBirth: editDateOfBirth,
          primaryCondition: editPrimaryCondition,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Patient Demographics Updated',
          message: data.message,
        });
        setIsEditingPatient(false);
        loadPatientData();
      } else {
        addToast({ type: 'error', title: 'Update Failed', message: data.error });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setEditPatientLoading(false);
    }
  };

  // Build Graph Nodes & Edges from active prescriptions + multi-hop candidates
  const graphElements = useMemo(() => {
    const nodeMap = new Map<string, { id: string; name: string; type: any }>();
    const links: Array<{ source: string; target: string; severity?: string; mechanism?: string }> = [];

    // Prescribed drugs
    prescriptions.forEach((rx) => {
      nodeMap.set(rx.canonical_name.toLowerCase(), {
        id: rx.canonical_name.toLowerCase(),
        name: rx.canonical_name,
        type: 'Prescribed',
      });
    });

    // Direct findings
    if (assessment?.direct_findings) {
      assessment.direct_findings.forEach((df) => {
        links.push({
          source: df.drug_a_name.toLowerCase(),
          target: df.drug_b_name.toLowerCase(),
          severity: df.severity_level,
          mechanism: df.mechanism_categories || 'Direct Pairwise Interaction',
        });
      });
    }

    // Multi-hop candidates
    if (assessment?.multi_hop_candidates) {
      assessment.multi_hop_candidates.forEach((cand) => {
        cand.nodes.forEach((nName, idx) => {
          const lower = nName.toLowerCase();
          if (!nodeMap.has(lower)) {
            const isBridge = cand.bridge_drugs.includes(nName);
            nodeMap.set(lower, {
              id: lower,
              name: nName,
              type: isBridge ? 'Bridge' : 'Target',
            });
          }
          if (idx < cand.nodes.length - 1) {
            const nextName = cand.nodes[idx + 1].toLowerCase();
            links.push({
              source: lower,
              target: nextName,
              severity: cand.edge_severities[idx] || 'Moderate',
              mechanism: 'Candidate Traversal Bridge',
            });
          }
        });
      });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links,
    };
  }, [prescriptions, assessment]);

  const hasPolypharmacy = prescriptions.length >= 2;

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '64px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-muted)' }}>Retrieving patient regimen from PostgreSQL...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="app-container">
        <div
          className="card"
          style={{
            border: '1px solid var(--sev-major-border)',
            background: 'var(--sev-major-bg)',
            color: '#fca5a5',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Unable to Load Patient</h2>
          <p>{error || 'Patient profile not found.'}</p>
          <div style={{ marginTop: 16 }}>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              &larr; Back to Patient Cohort
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/dashboard"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          &larr; Back to Patient Cohort
        </Link>
      </div>

      {/* Patient Header Card */}
      <div
        className="hero-banner"
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-doctor">Patient profile #{patient.patient_id}</span>
            <span className="badge badge-safe">Synthetic ground truth</span>
          </div>
          <h1 className="hero-title" style={{ marginTop: 8 }}>
            {patient.full_name}
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 16,
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginTop: 6,
              flexWrap: 'wrap',
            }}
          >
            <div>MRN: <strong style={{ color: 'var(--accent-cyan)' }}>{patient.mrn}</strong></div>
            <div>DOB: <strong>{patient.date_of_birth}</strong></div>
            <div>Gender: <strong>{patient.gender}</strong></div>
            <div>
              Condition:{' '}
              <strong style={{ color: 'var(--text-main)' }}>
                {patient.primary_condition || 'Cardiovascular Polypharmacy'}
              </strong>
            </div>
          </div>

          {isEditingPatient && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                maxWidth: 520,
              }}
            >
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  className="input-field"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Gender
                </label>
                <select className="input-field" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={editDateOfBirth}
                  onChange={(e) => setEditDateOfBirth(e.target.value)}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Primary Condition
                </label>
                <input
                  className="input-field"
                  value={editPrimaryCondition}
                  onChange={(e) => setEditPrimaryCondition(e.target.value)}
                  placeholder="e.g. Atrial Fibrillation"
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  onClick={saveEditPatient}
                  disabled={editPatientLoading}
                  className="btn btn-primary btn-sm"
                >
                  {editPatientLoading ? 'Saving…' : 'Save (UPDATE SQL)'}
                </button>
                <button
                  onClick={() => setIsEditingPatient(false)}
                  disabled={editPatientLoading}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isEditingPatient && (
            <button
              onClick={openEditPatient}
              className="btn btn-secondary"
              style={{ padding: '10px 16px' }}
              title="Edit demographics — runs UPDATE patients SET ... in PostgreSQL"
            >
              ✎ Edit Patient
            </button>
          )}
          <button
            onClick={() => setIsAddRxModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '10px 18px', fontWeight: 700 }}
          >
            + Order Medication Regimen
          </button>
        </div>
      </div>

      {/* Active Regimen List Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Active Prescriptions ({prescriptions.length})
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              Relational prescriptions table records for patient #{patient.patient_id}. Click dosage to edit live.
            </p>
          </div>
          {!hasPolypharmacy && (
            <span className="badge badge-moderate">Single Drug — Polypharmacy Requires &ge;2 Drugs</span>
          )}
        </div>

        {prescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            No active prescriptions recorded for this patient. Click &quot;Order Medication Regimen&quot; above to prescribe.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Rx ID</th>
                  <th>Drug Name</th>
                  <th>Therapeutic Class</th>
                  <th>Dosage (Live Edit)</th>
                  <th>Frequency</th>
                  <th>Prescribed By</th>
                  <th>Start Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => {
                  const isEditing = editingRxId === rx.prescription_id;
                  return (
                    <tr key={rx.prescription_id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        #{rx.prescription_id}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {rx.canonical_name}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {rx.therapeutic_class || 'Anticoagulant / Antiarrhythmic'}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input
                              type="text"
                              value={editDosageValue}
                              onChange={(e) => setEditDosageValue(e.target.value)}
                              className="input-field"
                              style={{ width: 80, padding: '4px 8px', fontSize: '0.8rem' }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateDosage(rx.prescription_id)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '2px 8px' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRxId(null)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingRxId(rx.prescription_id);
                              setEditDosageValue(rx.dosage);
                            }}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px dashed var(--accent-cyan)',
                              color: 'var(--accent-cyan)',
                              fontWeight: 600,
                            }}
                            title="Click to update dosage via UPDATE SQL"
                          >
                            {rx.dosage} ✎
                          </span>
                        )}
                      </td>
                      <td>{rx.frequency}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {rx.prescribed_by}
                      </td>
                      <td>{rx.start_date}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleDiscontinueRx(rx.prescription_id, rx.canonical_name)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Discontinue
                        </button>
                        {currentUserRole === 'ADMIN' && (
                          <button
                            onClick={() => handleHardDeleteRx(rx.prescription_id, rx.canonical_name)}
                            className="btn btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              marginLeft: 6,
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#fca5a5',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                            title="Admin only: permanently removes the row (DELETE), unlike Discontinue which keeps it as history"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Screening Trigger Controls */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <input
              type="text"
              placeholder="Clinical audit notes (e.g., Pre-operative polypharmacy evaluation)"
              className="input-field"
              value={assessmentNotes}
              onChange={(e) => setAssessmentNotes(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Traversal depth
            </label>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 3 }}>
              {[1, 2, 3].map((depth) => (
                <button
                  key={depth}
                  type="button"
                  onClick={() => setMaxHopDepth(depth)}
                  title={
                    depth === 1
                      ? 'Direct pairwise findings only — PostgreSQL, no Neo4j traversal'
                      : `Direct findings + up to ${depth}-hop candidate pathways in Neo4j`
                  }
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: maxHopDepth === depth ? 'var(--primary)' : 'transparent',
                    color: maxHopDepth === depth ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  {depth}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={handleRunScreening}
              disabled={analyzing || !hasPolypharmacy}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontWeight: 700 }}
            >
              {analyzing ? 'Traversing Relational & Neo4j Graphs...' : '⚡ Launch Multi-Hop Risk Discovery'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Force-Directed Graph Visualizer */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
          Embedded Interactive Neo4j Graph Visualizer
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Interactive topological view showing prescribed nodes (blue), discovered bridge nodes (amber), and target interaction candidates (red).
        </p>

        <InteractionGraphViewer
          nodes={graphElements.nodes}
          links={graphElements.links}
          width={800}
          height={340}
        />
      </div>

      {/* Discovered Findings Cards */}
      {assessment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary KPI Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="badge badge-doctor" style={{ marginBottom: 6, display: 'inline-block' }}>
                  SESSION ID #{assessment.assessment_id} (PERSISTED IN POSTGRESQL)
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  Cross-Database Dual Screening Summary
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>
                    {assessment.summary.direct_interaction_count}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#fca5a5' }}>Direct Pairwise (PostgreSQL)</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4' }}>
                    {assessment.summary.multi_hop_candidate_count}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#67e8f9' }}>Multi-Hop Bridges (Neo4j)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Findings */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
              Direct Pairwise Documented Interactions (Relational PostgreSQL)
            </h3>
            {assessment.direct_findings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No direct pairwise interactions documented in DDInter or MecDDI.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assessment.direct_findings.map((df, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#cbd5e1', fontSize: '0.68rem' }}>
                          Documented interaction
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                        {df.drug_a_name} &harr; {df.drug_b_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                        Mechanism: {df.mechanism_categories || 'Not categorized'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${severityBadgeClass(df.severity_level)}`}>{df.severity_level}</span>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#94a3b8', marginTop: 4 }}>
                        {df.evidence_sources}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Multi-Hop Findings */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
              Bounded Multi-Hop Candidate Pathways (Neo4j Graph Traversal)
            </h3>

            {/* Scientific disclaimer \u2014 verbatim from the API, shown as a
                prominent callout, never fine print. Multi-hop results are
                mechanistic hypotheses, not confirmed clinical interactions. */}
            <div className="disclaimer-banner" style={{ marginBottom: 16 }}>
              <span className="disclaimer-icon">⚠</span>
              <span className="disclaimer-text">{assessment.scientific_disclaimer}</span>
            </div>

            {assessment.multi_hop_candidates.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {maxHopDepth === 1
                  ? 'Traversal depth was set to 1 (direct findings only) \u2014 Neo4j was not queried.'
                  : `No candidate pathways discovered within ${maxHopDepth} hops.`}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assessment.multi_hop_candidates.map((cand, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px dashed rgba(6, 182, 212, 0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <span className="badge badge-moderate" style={{ marginBottom: 8, display: 'inline-block' }}>
                          Candidate pathway (hypothesis)
                        </span>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                          {cand.nodes.join(' \u2192 ')}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                          Bridge drug: <strong style={{ color: '#f59e0b' }}>{cand.bridge_drugs.join(', ')}</strong> &middot; {cand.hop_count} hops
                        </div>
                      </div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>
                        Neo4j Cypher traversal
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {cand.edge_severities.map((sev, si) => (
                        <span key={si} className={`badge ${severityBadgeClass(sev)}`} style={{ fontSize: '0.68rem' }}>
                          Edge {si + 1}: {sev}
                        </span>
                      ))}
                      {Array.from(new Set(cand.edge_mechanisms.flat().filter(Boolean))).map((mech, mi) => (
                        <span
                          key={mi}
                          className="badge"
                          style={{ background: 'transparent', border: '1px solid rgba(6, 182, 212, 0.4)', color: '#67e8f9', fontSize: '0.68rem' }}
                        >
                          {mech}
                        </span>
                      ))}
                      {Array.from(new Set(cand.edge_sources.filter(Boolean))).map((src, srci) => (
                        <span
                          key={srci}
                          className="badge"
                          style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>

                    <VerifyOnDisk
                      query={`MATCH path = (d1:Drug {canonical_name: "${cand.drug_a_name}"})-[r:INTERACTS_WITH*${cand.hop_count}]-(d2:Drug {canonical_name: "${cand.drug_b_name}"})\nRETURN path;`}
                      language="cypher"
                      expected={`A ${cand.hop_count + 1}-node path through ${cand.bridge_drugs.join(', ')} — the exact bridge this app just found.`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AddPrescriptionModal
        isOpen={isAddRxModalOpen}
        patientId={Number(patientId)}
        onClose={() => setIsAddRxModalOpen(false)}
        onSuccess={() => {
          addToast({
            type: 'success',
            title: 'Medication Prescribed',
            message: `Recorded active medication order in PostgreSQL table "prescriptions".`,
          });
          loadPatientData();
        }}
      />

      <ConfirmDialog
        isOpen={!!pendingDiscontinue}
        title="Discontinue prescription"
        message={
          pendingDiscontinue
            ? `This marks "${pendingDiscontinue.name}" as discontinued in PostgreSQL. The patient's active medication count and future screenings will no longer include it.`
            : ''
        }
        confirmText="Discontinue"
        destructive
        loading={discontinueLoading}
        onConfirm={confirmDiscontinueRx}
        onCancel={() => setPendingDiscontinue(null)}
      />

      <ConfirmDialog
        isOpen={!!pendingHardDelete}
        title="Permanently delete prescription"
        message={
          pendingHardDelete
            ? `This runs a hard DELETE on "${pendingHardDelete.name}" — the row is gone from PostgreSQL entirely, unlike Discontinue which keeps it as history. Type DELETE to confirm.`
            : ''
        }
        confirmText="Delete permanently"
        confirmKeyword="DELETE"
        destructive
        loading={hardDeleteLoading}
        onConfirm={confirmHardDeleteRx}
        onCancel={() => setPendingHardDelete(null)}
      />
    </div>
  );
}
