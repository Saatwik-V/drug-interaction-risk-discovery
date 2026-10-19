'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserAccount {
  userId: number;
  username: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export default function AdminConsolePage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // New user form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DOCTOR' | 'ADMIN'>('DOCTOR');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch user accounts.');
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to parse user accounts response.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with administration services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to create user account.');
        return;
      }

      setFormSuccess(`Account '${data.data.username}' successfully created with role ${data.data.role}.`);
      // Reset form
      setUsername('');
      setFullName('');
      setPassword('');
      setRole('DOCTOR');
      // Reload accounts table
      loadUsers();
    } catch {
      setFormError('Network or server error while provisioning new account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (forbidden) {
    return (
      <div className="app-container" style={{ maxWidth: 600, marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--sev-major-border)' }}>
          <div className="empty-state-icon" style={{ color: 'var(--sev-major)' }}>🚫</div>
          <h2>403 Forbidden: Administrative Role Required</h2>
          <p style={{ marginTop: 8, marginBottom: 20 }}>
            Your authenticated session does not have administrative privileges. System user provisioning and
            database account management is restricted to <strong>ADMIN</strong> roles.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Return to Clinician Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-admin">Administrative Console</span>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                PostgreSQL user_accounts
              </span>
            </div>
            <h1>System Security &amp; User Account Administration</h1>
            <p style={{ marginTop: 4, maxWidth: 680 }}>
              Manage clinician credentials and role privileges. Password credentials are salted and hashed
              server-side using 10 bcrypt rounds. Hashes are never exposed over the API.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={loadUsers} className="btn btn-secondary btn-sm" disabled={loading}>
              Refresh Accounts
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr', gap: 28, alignItems: 'start' }}>
        {/* Left Column: Registered Users Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Application User Directory</h2>
              <p style={{ fontSize: '0.85rem', marginTop: 2 }}>
                Current active credentials in relational table <code>user_accounts</code>.
              </p>
            </div>
            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              {users.length} Active Accounts
            </span>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28 }} />
              <p>Querying application user directory...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        #{u.userId}
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                        {u.username}
                      </td>
                      <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-doctor'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: u.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: u.isActive ? '#34d399' : '#fb7185',
                          }}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Register New Account Form */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Provision New Application Account</h3>
              <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                Creates a new user record with salted bcrypt password hashing.
              </p>
            </div>
          </div>

          {formError && (
            <div className="alert alert-error" role="alert">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="alert alert-success" role="alert">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-username">
                Username (Unique Login ID)
              </label>
              <input
                id="new-username"
                type="text"
                className="form-input"
                placeholder="e.g. dr_mehta or clin_lead"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-fullname">
                Full Clinician / Staff Name
              </label>
              <input
                id="new-fullname"
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Priya Mehta, MD"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-role">
                Assigned Role Boundary
              </label>
              <select
                id="new-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as 'DOCTOR' | 'ADMIN')}
              >
                <option value="DOCTOR">Doctor (Clinician — Polypharmacy Screening &amp; Cohort Access)</option>
                <option value="ADMIN">Admin (Full Administrative Access &amp; User Provisioning)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                Initial Password
              </label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Hashing &amp; Provisioning...
                </>
              ) : (
                'Create User Account'
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
            }}
          >
            <strong>RBAC Enforcement</strong>: Account creation inserts into PostgreSQL <code>user_accounts</code>.
            Roles strictly dictate server-side API authorization.
          </div>
        </div>
      </div>
    </div>
  );
}
