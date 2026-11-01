'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AddPatientModal from '@/components/modals/AddPatientModal';
import { useToast } from '@/components/ui/Toast';

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
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to retrieve patients from PostgreSQL.');
      const data = await res.json();
      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching patients.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && isMounted) {
            setUser(userData.user);
          }
        }

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

  const handleDeletePatient = async (patientId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete patient "${name}"? This will CASCADE and delete all their child prescriptions and assessments!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Patient Deleted (CASCADE)',
          message: data.message,
        });
        fetchPatients();
      } else {
        addToast({
          type: 'error',
          title: 'Deletion Failed',
          message: data.error,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message,
      });
    }
  };

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span className="badge badge-doctor" style={{ marginBottom: 10, display: 'inline-block' }}>
            CLINICAL OPERATING SYSTEM
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome, {user ? user.fullName : 'Doctor'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
            Synthetic Patient Cohort &amp; Direct-to-Multi-Hop Polypharmacy Interaction Screening
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontWeight: 700 }}
          >
            + Add Synthetic Patient
          </button>
        </div>
      </div>

      {/* Cohort KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Cohort Patients
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 8 }}>
            {totalPatients}
          </div>
          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', marginTop: 4 }}>
            PostgreSQL Ground Truth
          </div>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Polypharmacy Regimens
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--sev-moderate)', marginTop: 8 }}>
            {polypharmacyCandidates}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
            Candidates for Graph Traversal (&ge;2 meds)
          </div>
        </div>

        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Prescribed Regimen Orders
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>
            {totalActiveMedications}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
            Harmonized Rx across patient registry
          </div>
        </div>
      </div>

      {/* Patient Cohort Table Card */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Synthetic Patient Registry
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              Select a patient record to view active prescriptions or launch multi-hop graph risk discovery.
            </p>
          </div>
          <div style={{ minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by name, MRN, or ID..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--sev-major-bg)',
              border: '1px solid var(--sev-major-border)',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <div>Querying PostgreSQL patient records...</div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            No patient records found matching query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient Name</th>
                  <th>MRN</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Active Medications</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => {
                  const hasPolypharmacy = (p.active_medication_count || 0) >= 2;
                  return (
                    <tr key={p.patient_id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        #{p.patient_id}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <Link
                          href={`/patients/${p.patient_id}`}
                          style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                        >
                          {p.full_name}
                        </Link>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                        {p.mrn}
                      </td>
                      <td>{p.date_of_birth}</td>
                      <td>{p.gender}</td>
                      <td>
                        <span
                          className={`badge ${
                            hasPolypharmacy ? 'badge-major' : 'badge-doctor'
                          }`}
                        >
                          {p.active_medication_count} active{' '}
                          {p.active_medication_count === 1 ? 'drug' : 'drugs'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-safe">Synthetic Guarded</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Link
                            href={`/patients/${p.patient_id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Screen Regimen &rarr;
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDeletePatient(p.patient_id, p.full_name)}
                              className="btn btn-sm"
                              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                              title="Delete Patient (CASCADE)"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          addToast({
            type: 'success',
            title: 'Patient Registered',
            message: 'New synthetic patient created in PostgreSQL table "patients".',
          });
          fetchPatients();
        }}
      />
    </div>
  );
}
