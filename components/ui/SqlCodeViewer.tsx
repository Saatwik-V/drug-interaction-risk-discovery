'use client';

import React, { useState } from 'react';

interface SqlCodeViewerProps {
  code: string;
  title?: string;
  language?: string;
  latencyMs?: number;
}

export default function SqlCodeViewer({
  code,
  title,
  language = 'sql',
  latencyMs,
}: SqlCodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 8,
        background: '#090d16',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        margin: '12px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.78rem',
          color: '#94a3b8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{title || language.toUpperCase()}</span>
          {latencyMs !== undefined && (
            <span
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                padding: '2px 6px',
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: '0.72rem',
              }}
            >
              ⚡ {latencyMs}ms
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            color: copied ? '#34d399' : '#cbd5e1',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? '✓ Copied' : 'Copy Query'}
        </button>
      </div>
      <pre
        style={{
          padding: '14px',
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.84rem',
          color: '#38bdf8',
          lineHeight: 1.5,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
