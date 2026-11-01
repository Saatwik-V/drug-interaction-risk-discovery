'use client';

import React, { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmKeyword?: string; // If provided, user must type this exact string (e.g. "DELETE")
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm Action',
  confirmKeyword,
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const [typedInput, setTypedInput] = useState('');

  if (!isOpen) return null;

  const isKeywordMatching = !confirmKeyword || typedInput.trim() === confirmKeyword.trim();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: 460,
          background: '#0d1322',
          border: destructive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          animation: 'modalSlideIn 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '1.25rem' }}>{destructive ? '⚠️' : 'ℹ️'}</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{title}</h3>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 16 }}>
          {message}
        </p>

        {confirmKeyword && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
              Type <strong style={{ color: destructive ? '#ef4444' : '#38bdf8' }}>{confirmKeyword}</strong> to confirm:
            </label>
            <input
              type="text"
              className="input-field"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={confirmKeyword}
              autoFocus
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !isKeywordMatching}
            className="btn"
            style={{
              padding: '8px 18px',
              background: destructive ? '#ef4444' : '#6366f1',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            {loading ? 'Executing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
