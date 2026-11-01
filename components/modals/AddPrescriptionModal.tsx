'use client';

import React, { useState, useEffect } from 'react';

interface AddPrescriptionModalProps {
  isOpen: boolean;
  patientId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface DrugOption {
  drug_id: number;
  canonical_name: string;
  therapeutic_class: string | null;
}

export default function AddPrescriptionModal({
  isOpen,
  patientId,
  onClose,
  onSuccess,
}: AddPrescriptionModalProps) {
  const [drugs, setDrugs] = useState<DrugOption[]>([]);
  const [selectedDrugId, setSelectedDrugId] = useState<number | ''>('');
  const [dosage, setDosage] = useState('10mg');
  const [frequency, setFrequency] = useState('Once daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchDrugs() {
      try {
        const res = await fetch('/api/prescriptions');
        const data = await res.json();
        if (data.success && data.data) {
          setDrugs(data.data);
          if (data.data.length > 0) {
            setSelectedDrugId(data.data[0].drug_id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load drugs master list:', err);
      }
    }
    fetchDrugs();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrugId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          drugId: selectedDrugId,
          dosage,
          frequency,
          startDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to prescribe drug in PostgreSQL.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording medication order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 500,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            + Order Medication Regimen (PostgreSQL DML)
          </h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                Select Medication (Master Drug Catalog) *
              </label>
              <select
                className="input-field"
                value={selectedDrugId}
                onChange={(e) => setSelectedDrugId(Number(e.target.value))}
                required
              >
                {drugs.map((d) => (
                  <option key={d.drug_id} value={d.drug_id}>
                    {d.canonical_name} ({d.therapeutic_class || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                  Dosage *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 5mg or 200mg"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                  Frequency *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once daily"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                Start Date *
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Recording in PostgreSQL...' : 'Record Prescription'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
