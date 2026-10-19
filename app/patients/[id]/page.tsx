'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Patient {
  patient_id: number;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  is_synthetic: boolean;
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
  direct_findings: DirectInteractionResult[];
  multi_hop_candidates: CandidatePathway[];
  scientific_disclaimer: string;
}

type DirectInteractionResult = DirectInteraction;

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState('');

  // Fetch patient profile and active medications
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
        throw new Error(data.error || 'Failed to parse patient payload.');
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

  // Execute Cross-Database Risk Screening
  const handleRunAssessment = async () => {
    if (!patientId) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`/api/patients/${patientId}/analyze-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: assessmentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Polypharmacy risk assessment failed to execute.');
      }

      setAssessment(data.data);
    } catch (err: any) {
      setError(err.message || 'Error occurred while querying relational & graph databases.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === 'major') return 'badge-major';
    if (s === 'moderate') return 'badge-moderate';
    if (s === 'minor') return 'badge-minor';
    return 'badge-unknown';
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="card empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
          <h3>Loading synthetic patient profile #{patientId}...</h3>
          <p>Querying demographics and active prescriptions from PostgreSQL.</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="app-container">
        <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ color: 'var(--sev-major)' }}>⚠️</div>
          <h2>Patient Profile Not Available</h2>
          <p style={{ marginTop: 8, marginBottom: 20 }}>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={loadPatientData} className="btn btn-secondary">
              Retry Query
            </button>
            <Link href="/dashboard" className="btn btn-primary">
              Return to Patient Cohort
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard" style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to Patient Cohort
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-synthetic">SYNTHETIC PATIENT #{patient?.patient_id}</span>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                MRN: {patient?.mrn}
              </span>
            </div>
            <h1>{patient?.full_name}</h1>
            <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <div><strong>DOB:</strong> {patient?.date_of_birth}</div>
              <div><strong>Gender:</strong> {patient?.gender}</div>
              <div><strong>Active Medications:</strong> {prescriptions.length}</div>
            </div>
          </div>

          <div>
            <button
              onClick={handleRunAssessment}
              disabled={analyzing || prescriptions.length < 2}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '1rem' }}
            >
              {analyzing ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  Running Multi-Hop Screening...
                </>
              ) : (
                'Run Polypharmacy Risk Screening ⚡'
              )}
            </button>
            {prescriptions.length < 2 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                Requires ≥ 2 active medications for interaction screening.
              </div>
            )}
          </div>
        </div>

        {/* Optional Clinical Notes Input */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <label className="form-label" htmlFor="assessment-notes">
            Clinical Assessment Note (Optional Audit Log)
          </label>
          <input
            id="assessment-notes"
            type="text"
            className="form-input"
            placeholder="e.g. Pre-operative cardiac polypharmacy screening prior to stent placement"
            value={assessmentNotes}
            onChange={(e) => setAssessmentNotes(e.target.value)}
            disabled={analyzing}
          />
        </div>
      </div>

      {/* Active Medication Regimen Table */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div>
            <h2>Active Medication Regimen</h2>
            <p style={{ fontSize: '0.875rem', marginTop: 2 }}>
              Current verified prescriptions stored with ACID transactional integrity in PostgreSQL.
            </p>
          </div>
          <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9' }}>
            {prescriptions.length} Active Prescriptions
          </span>
        </div>

        {prescriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <p>No active prescriptions recorded for this patient.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Drug Canonical Name</th>
                  <th>Therapeutic Class</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Prescribed By</th>
                  <th>Start Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.prescription_id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                      {rx.canonical_name}
                    </td>
                    <td>{rx.therapeutic_class || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{rx.dosage}</td>
                    <td>{rx.frequency}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{rx.prescribed_by}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{rx.start_date}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        {rx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assessment Failure Alert */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 28 }}>
          <strong>Assessment Error:</strong> {error}
        </div>
      )}

      {/* Assessment Results Section */}
      {assessment && (
        <div style={{ marginTop: 32 }}>
          {/* Assessment Summary Header */}
          <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                    Assessment #{assessment.assessment_id || 'Active'}
                  </span>
                  <span className={`badge ${getSeverityBadgeClass(assessment.summary.max_severity_found)}`}>
                    Max Severity: {assessment.summary.max_severity_found}
                  </span>
                </div>
                <h2>Polypharmacy Risk Assessment Findings</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cross-DB Engine Execution</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
                  PostgreSQL ACID + Neo4j Graph
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div className="stat-title">Direct Pairwise Interactions</div>
                <div className="stat-value" style={{ color: '#f43f5e' }}>
                  {assessment.summary.direct_interaction_count}
                </div>
                <div className="stat-desc">Documented in DDInter / MecDDI</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Candidate Multi-Hop Paths</div>
                <div className="stat-value" style={{ color: '#06b6d4' }}>
                  {assessment.summary.multi_hop_candidate_count}
                </div>
                <div className="stat-desc">Discovered via Neo4j Cypher</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Traversal Depth Bounds</div>
                <div className="stat-value">2 – {assessment.summary.max_hop_depth_searched} Hops</div>
                <div className="stat-desc">Cycle-bounded simple paths</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">Overall Risk Category</div>
                <div className="stat-value" style={{ fontSize: '1.6rem' }}>
                  <span className={`badge ${getSeverityBadgeClass(assessment.summary.max_severity_found)}`}>
                    {assessment.summary.max_severity_found}
                  </span>
                </div>
                <div className="stat-desc">Highest severity across all paths</div>
              </div>
            </div>

            {/* Scientific Disclaimer Alert (Rubric & Integrity Requirement) */}
            <div className="disclaimer-banner">
              <div className="disclaimer-icon">⚠️</div>
              <div className="disclaimer-text">
                <strong>Academic Prototype &amp; Domain Disclaimer</strong>: {assessment.scientific_disclaimer}
              </div>
            </div>
          </div>

          {/* Findings Side-by-Side Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
            {/* Section 1: Direct Pairwise Findings */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Direct Pairwise Interactions</h3>
                  <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    Documented clinical drug-drug pairs verified in PostgreSQL.
                  </p>
                </div>
                <span className="badge badge-major">
                  {assessment.direct_findings.length} Found
                </span>
              </div>

              {assessment.direct_findings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <h4>No Direct Interactions Documented</h4>
                  <p style={{ fontSize: '0.85rem' }}>
                    No documented pairwise drug-drug interactions exist between the active medications.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {assessment.direct_findings.map((df) => (
                    <div
                      key={df.pair_id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>
                          <span style={{ color: '#a5b4fc' }}>{df.drug_a_name}</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>↔</span>
                          <span style={{ color: '#a5b4fc' }}>{df.drug_b_name}</span>
                        </div>
                        <span className={`badge ${getSeverityBadgeClass(df.severity_level)}`}>
                          {df.severity_level}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gap: 4 }}>
                        <div>
                          <strong>Mechanism:</strong> {df.mechanism_categories || 'Unspecified pharmacological mechanism'}
                        </div>
                        <div>
                          <strong>Evidence Sources:</strong>{' '}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#67e8f9' }}>
                            {df.evidence_sources}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Candidate Multi-Hop Pathways */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Candidate Multi-Hop Pathways</h3>
                  <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    Mechanistic hypothesis bridges traversed via Neo4j Cypher.
                  </p>
                </div>
                <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9' }}>
                  {assessment.multi_hop_candidates.length} Discovered
                </span>
              </div>

              {assessment.multi_hop_candidates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h4>No Multi-Hop Candidate Bridges</h4>
                  <p style={{ fontSize: '0.85rem' }}>
                    No 2-hop or 3-hop intermediary interaction bridges discovered within the active regimen.
                  </p>
                </div>
              ) : (
                <div className="pathway-container">
                  {assessment.multi_hop_candidates.map((path, idx) => (
                    <div key={idx} className="pathway-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                          {path.hop_count}-Hop Traversal
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {path.edge_severities.map((sev, sIdx) => (
                            <span key={sIdx} className={`badge ${getSeverityBadgeClass(sev)}`} style={{ fontSize: '0.7rem' }}>
                              Edge {sIdx + 1}: {sev}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Visual Pathway Breadcrumb Chain */}
                      <div className="pathway-chain">
                        {path.nodes.map((nodeName, nIdx) => {
                          const isEndpoint = nIdx === 0 || nIdx === path.nodes.length - 1;
                          const isBridge = !isEndpoint;

                          return (
                            <React.Fragment key={nIdx}>
                              <div
                                className={`pathway-node ${isEndpoint ? 'endpoint' : 'bridge'}`}
                                title={isBridge ? 'Intermediary Bridge Node' : 'Prescribed Regimen Endpoint'}
                              >
                                {nodeName}
                                {isBridge && (
                                  <span style={{ fontSize: '0.65rem', marginLeft: 4, opacity: 0.8 }}>(Bridge)</span>
                                )}
                              </div>
                              {nIdx < path.nodes.length - 1 && (
                                <div className="pathway-edge">
                                  <span className="pathway-edge-arrow">→</span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Bridge & Mechanism Metadata */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10, marginTop: 8 }}>
                        {path.bridge_drugs.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <strong>Intermediary Bridge Drug(s):</strong>{' '}
                            <span style={{ color: '#67e8f9', fontWeight: 600 }}>
                              {path.bridge_drugs.join(', ')}
                            </span>
                          </div>
                        )}
                        <div>
                          <strong>Hypothesis Rationale:</strong> Both endpoints interact with intermediary node{' '}
                          <em>{path.bridge_drugs.join(', ')}</em>, indicating a candidate shared metabolic or competitive clearance pathway.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
