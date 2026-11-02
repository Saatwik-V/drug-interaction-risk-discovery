'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface ForbiddenPanelProps {
  requiredRole?: string;
  currentRole?: string;
  message?: string;
}

/**
 * Designed 403 panel for a role-gated page or section — replaces a blank
 * screen when the server rejects a request with 403. The server-side
 * requireRole() check in the route handler is the actual boundary; this is
 * only the UI's way of explaining that boundary rather than failing silently.
 */
export default function ForbiddenPanel({ requiredRole, currentRole, message }: ForbiddenPanelProps) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: '48px auto', textAlign: 'center', padding: 40 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--sev-major-bg)',
          border: '1px solid var(--sev-major-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--sev-major)',
        }}
      >
        <ShieldAlert size={22} />
      </div>
      <h2 style={{ marginBottom: 8 }}>This page needs a different role</h2>
      <p style={{ marginBottom: requiredRole || currentRole ? 16 : 24 }}>
        {message || "You're signed in, but your account doesn't have access to this section."}
      </p>
      {(requiredRole || currentRole) && (
        <div
          style={{
            display: 'inline-flex',
            gap: 16,
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            marginBottom: 24,
          }}
        >
          {requiredRole && (
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Requires: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{requiredRole}</strong>
            </span>
          )}
          {currentRole && (
            <span>
              <span style={{ color: 'var(--text-muted)' }}>You are: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{currentRole}</strong>
            </span>
          )}
        </div>
      )}
      <div>
        <Link href="/dashboard" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
