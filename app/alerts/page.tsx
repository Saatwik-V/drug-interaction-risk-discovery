'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface Finding {
  finding_id: number;
  drug_a_id: number;
  drug_b_id: number;
  hop_count: number;
  traversal_path: string | null;
  severity_level: string;
  mechanism_category: string | null;
  evidence_sources: string;
  finding_type: 'DIRECT_INTERACTION' | 'CANDIDATE_PATHWAY';
}

interface AlertAssessment {
  assessment_id: number;
  patient_id: number;
  mrn: string;
  patient_name: string;
  performed_by: string;
  max_hop_depth: number;
  total_active_medications: number;
  direct_interaction_count: number;
  multi_hop_candidate_count: number;
  assessment_notes: string | null;
  created_at: string;
  findings: Finding[];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) {
          throw new Error('Failed to retrieve assessment alerts from database.');
        }
        const data = await res.json();
        if (data.success && isMounted) {
          setAlerts(data.data || []);
          if (data.data?.length > 0) {
            setSelectedAssessmentId(data.data[0].assessment_id);
          }
        } else {
          throw new Error(data.error || 'Failed to load historical assessments.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error communicating with database services.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAlerts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return alerts;
    return alerts.filter(
      (a) =>
        a.patient_name.toLowerCase().includes(q) ||
        a.mrn.toLowerCase().includes(q) ||
        a.performed_by.toLowerCase().includes(q) ||
        a.assessment_id.toString().includes(q)
    );
  }, [alerts, searchFilter]);

  const selectedAssessment = useMemo(() => {
    return alerts.find((a) => a.assessment_id === selectedAssessmentId) || null;
  }, [alerts, selectedAssessmentId]);

  const getSeverityBadgeClass = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === 'major') return 'badge-major';
    if (s === 'moderate') return 'badge-moderate';
    if (s === 'minor') return 'badge-minor';
    return 'badge-unknown';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-doctor">Clinical Decision Support</span>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                Transactional Audit Log
              </span>
            </div>
            <h1>Polypharmacy Risk Alerts &amp; Assessment History</h1>
            <p style={{ marginTop: 4, maxWidth: 650 }}>
              Chronological log of cross-database screening assessments. Records ACID transaction history
              from <code>risk_assessments</code> and trigger-audited <code>assessment_findings</code>.
            </p>
          </div>

          <div style={{ width: 300 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by patient, MRN, clinician..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
          <h3>Retrieving historical clinical assessments...</h3>
          <p>Querying PostgreSQL risk assessment audit log.</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🛡️</div>
          <h3>No Assessment Alerts Found</h3>
          <p style={{ marginTop: 4 }}>
            {searchFilter
              ? `No assessments matched filter "${searchFilter}".`
              : 'No polypharmacy assessments have been recorded yet. Visit the Patient Dashboard to run an initial screening.'}
          </p>
          <div style={{ marginTop: 20 }}>
            <Link href="/dashboard" className="btn btn-primary">
              Go to Patient Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24, alignItems: 'start' }}>
          {/* Assessment List Column */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
              Logged Evaluations ({filteredAlerts.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 720, overflowY: 'auto' }}>
              {filteredAlerts.map((item) => {
                const isSelected = item.assessment_id === selectedAssessmentId;
                const hasDirect = item.direct_interaction_count > 0;

                return (
                  <div
                    key={item.assessment_id}
                    onClick={() => setSelectedAssessmentId(item.assessment_id)}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: isSelected
                        ? '1px solid #6366f1'
                        : '1px solid var(--border-subtle)',
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.12)'
                        : 'rgba(15, 23, 42, 0.5)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {item.patient_name}
                      </span>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        #{item.assessment_id}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      MRN: <span style={{ fontFamily: 'var(--font-mono)' }}>{item.mrn}</span> • Evaluated by{' '}
                      <strong>{item.performed_by}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="badge"
                        style={{
                          background: hasDirect ? 'var(--sev-major-bg)' : 'rgba(148, 163, 184, 0.1)',
                          color: hasDirect ? 'var(--sev-major)' : 'var(--text-muted)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {item.direct_interaction_count} Direct
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(6, 182, 212, 0.12)',
                          color: '#38bdf8',
                          fontSize: '0.7rem',
                        }}
                      >
                        {item.multi_hop_candidate_count} Multi-Hop
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment Detail Column */}
          {selectedAssessment ? (
            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                      Evaluation #{selectedAssessment.assessment_id}
                    </span>
                    <span className="badge badge-synthetic">MRN: {selectedAssessment.mrn}</span>
                  </div>
                  <h2>{selectedAssessment.patient_name}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Performed by <strong>{selectedAssessment.performed_by}</strong> on{' '}
                    {new Date(selectedAssessment.created_at).toLocaleString()}
                  </div>
                </div>

                <Link
                  href={`/patients/${selectedAssessment.patient_id}`}
                  className="btn btn-primary btn-sm"
                >
                  Open Patient Profile →
                </Link>
              </div>

              {/* Assessment Notes */}
              {selectedAssessment.assessment_notes && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    marginBottom: 20,
                  }}
                >
                  <strong>Clinical Note:</strong> {selectedAssessment.assessment_notes}
                </div>
              )}

              {/* Summary Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Drugs</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedAssessment.total_active_medications}</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Direct Pairs</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>{selectedAssessment.direct_interaction_count}</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Multi-Hop Paths</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4' }}>{selectedAssessment.multi_hop_candidate_count}</div>
                </div>
              </div>

              {/* Findings Breakdown */}
              <div>
                <h3 style={{ marginBottom: 14 }}>Recorded Assessment Findings ({selectedAssessment.findings.length})</h3>

                {selectedAssessment.findings.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No adverse interaction findings persisted for this assessment session.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedAssessment.findings.map((f) => (
                      <div
                        key={f.finding_id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: 14,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span
                            className="badge"
                            style={{
                              background:
                                f.finding_type === 'DIRECT_INTERACTION'
                                  ? 'rgba(244, 63, 94, 0.15)'
                                  : 'rgba(6, 182, 212, 0.15)',
                              color: f.finding_type === 'DIRECT_INTERACTION' ? '#fb7185' : '#38bdf8',
                              fontSize: '0.72rem',
                            }}
                          >
                            {f.finding_type === 'DIRECT_INTERACTION' ? 'Direct Documented Pair' : `${f.hop_count}-Hop Candidate Pathway`}
                          </span>

                          <span className={`badge ${getSeverityBadgeClass(f.severity_level)}`}>
                            {f.severity_level}
                          </span>
                        </div>

                        {f.traversal_path && (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.85rem',
                              color: '#a5b4fc',
                              background: '#0d1322',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              marginBottom: 8,
                            }}
                          >
                            {f.traversal_path}
                          </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'grid', gap: 4 }}>
                          {f.mechanism_category && (
                            <div>
                              <strong>Mechanism:</strong> {f.mechanism_category}
                            </div>
                          )}
                          <div>
                            <strong>Evidence Sources:</strong>{' '}
                            <span style={{ fontFamily: 'var(--font-mono)', color: '#67e8f9' }}>
                              {f.evidence_sources}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card empty-state">
              <p>Select an evaluation from the list to view its audit findings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
