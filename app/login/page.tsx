'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      // Successful login
      router.push(from);
      router.refresh();
    } catch {
      setError('Network or server error encountered during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="app-container" style={{ maxWidth: 480, marginTop: 40 }}>
      <div className="card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className="brand-icon"
            style={{ width: 48, height: 48, margin: '0 auto 16px', fontSize: '1.25rem' }}
          >
            Rx
          </div>
          <h1>System Authentication</h1>
          <p style={{ marginTop: 6, fontSize: '0.875rem' }}>
            Dual-Database Polypharmacy Risk Discovery Platform
          </p>
          <div
            style={{
              marginTop: 10,
              display: 'inline-flex',
              padding: '2px 10px',
              borderRadius: 9999,
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.75rem',
              color: '#818cf8',
              fontWeight: 600,
            }}
          >
            PES University • DBMS Level 3
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dr_sharma or admin"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Authenticating...
              </>
            ) : (
              'Sign In with Verified Credentials'
            )}
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Quick Viva / Demonstration Roles
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('dr_sharma', 'Doctor@123')}
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <span className="badge badge-doctor" style={{ padding: '2px 6px', fontSize: '0.68rem' }}>
                Doctor
              </span>
              <span>dr_sharma</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('admin', 'Admin@123')}
              style={{ fontSize: '0.78rem', justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <span className="badge badge-admin" style={{ padding: '2px 6px', fontSize: '0.68rem' }}>
                Admin
              </span>
              <span>admin</span>
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          <strong>Security Notice</strong>: Passwords validated via server-side salted bcrypt hashes.
          Sessions managed via cryptographic HttpOnly JWT cookies.
        </div>
      </div>
    </div>
  );
}
