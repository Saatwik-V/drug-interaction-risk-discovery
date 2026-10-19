'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface Patient {
  patient_id: number;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  is_synthetic: boolean;
  active_medication_count: number;
}

interface UserProfile {
  userId: number;
  username: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
}

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch current user profile
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && isMounted) {
            setUser(userData.user);
          }
        }

        // Fetch patient cohort
        const patientsRes = await fetch('/api/patients');
        if (!patientsRes.ok) {
          throw new Error('Failed to retrieve patient cohort from relational database.');
        }
        const patientsData = await patientsRes.json();
        if (patientsData.success && isMounted) {
          setPatients(patientsData.data || []);
        } else {
          throw new Error(patientsData.error || 'Unknown error occurred while fetching patients.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error communicating with database services.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter patients based on search input
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.patient_id.toString().includes(q)
    );
  }, [patients, searchQuery]);

  // Cohort statistics
  const totalPatients = patients.length;
  const polypharmacyCandidates = patients.filter((p) => p.active_medication_count >= 2).length;
  const totalActiveMedications = patients.reduce(
    (acc, curr) => acc + (curr.active_medication_count || 0),
    0
  );

  return (
    <div className="app-container">
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-doctor'}`}>
                {user?.role || 'Clinician'} Session
              </span>
              <span className="badge badge-synthetic">Synthetic Data Guardrail Active</span>
            </div>
            <h1>Clinician Screening &amp; Polypharmacy Dashboard</h1>
            <p style={{ marginTop: 4, maxWidth: 640 }}>
              Welcome back, <strong>{user?.fullName || 'Doctor'}</strong>. Select a patient to inspect active
              prescriptions, trigger relational pairwise lookups, and discover bounded multi-hop candidate pathways.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/alerts" className="btn btn-secondary">
              Review Alert History
            </Link>
          </div>
        </div>
      </div>

      {/* Cohort Overview Metrics */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-title">Total Synthetic Patients</div>
          <div className="stat-value">{loading ? '—' : totalPatients}</div>
          <div className="stat-desc">Relational records in PostgreSQL</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Polypharmacy Candidates</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {loading ? '—' : polypharmacyCandidates}
          </div>
          <div className="stat-desc">Patients with ≥ 2 active medications</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Active Regimen Drugs</div>
          <div className="stat-value" style={{ color: '#a855f7' }}>
            {loading ? '—' : totalActiveMedications}
          </div>
          <div className="stat-desc">Active prescription instances</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Multi-Hop Traversal Depth</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            2 – 3 Hops
          </div>
          <div className="stat-desc">Bounded Neo4j Cypher path search</div>
        </div>
      </div>

      {/* Patient Cohort Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Synthetic Patient Registry</h2>
            <p style={{ fontSize: '0.875rem', marginTop: 2 }}>
              Select a patient record to execute an automated multi-hop interaction discovery analysis.
            </p>
          </div>

          <div style={{ width: 320 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Patient Name or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28 }} />
            <p>Querying patient records from PostgreSQL...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No matching patients found</h3>
            <p style={{ marginTop: 4 }}>
              {searchQuery
                ? `No records matched your search query "${searchQuery}".`
                : 'No synthetic patients currently registered.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>MRN</th>
                  <th>Patient Full Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Active Medications</th>
                  <th>Screening Eligibility</th>
                  <th style={{ textAlign: 'right' }}>Clinical Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const isEligible = patient.active_medication_count >= 2;
                  return (
                    <tr key={patient.patient_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {patient.mrn}
                      </td>
                      <td style={{ fontWeight: 600 }}>{patient.full_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{patient.date_of_birth}</td>
                      <td>{patient.gender}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 26,
                            height: 26,
                            padding: '0 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background:
                              patient.active_medication_count > 0
                                ? 'rgba(99, 102, 241, 0.15)'
                                : 'rgba(255, 255, 255, 0.05)',
                            color: patient.active_medication_count > 0 ? '#818cf8' : 'var(--text-muted)',
                          }}
                        >
                          {patient.active_medication_count}
                        </span>
                      </td>
                      <td>
                        {isEligible ? (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            Eligible (≥ 2 Drugs)
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(148, 163, 184, 0.1)',
                              color: 'var(--text-muted)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                            }}
                          >
                            Single Agent (&lt; 2)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/patients/${patient.patient_id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Open &amp; Analyze Risk →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
