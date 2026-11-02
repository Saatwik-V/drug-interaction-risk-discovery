'use client';

import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

interface VerifyOnDiskProps {
  /** The exact query to paste into pgAdmin 4 / Neo4j Browser. */
  query: string;
  language?: 'sql' | 'cypher';
  /** One-line plain-English statement of what the examiner should see. */
  expected: string;
  /** Re-runs the same read-only check live, from this app, against the real
   * database — not a second UI claiming success, an actual re-query. */
  onReRead?: () => Promise<string>;
}

/**
 * Pairs every mutating Database Lab demo with the exact verification command
 * for pgAdmin 4 / Neo4j Browser, plus a live "Re-read from database" button
 * that runs the same read here and now — so "it worked" is never just this
 * app's own claim.
 */
export default function VerifyOnDisk({ query, language = 'sql', expected, onReRead }: VerifyOnDiskProps) {
  const [copied, setCopied] = useState(false);
  const [rereading, setRereading] = useState(false);
  const [rereadResult, setRereadResult] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReRead = async () => {
    if (!onReRead) return;
    setRereading(true);
    try {
      const result = await onReRead();
      setRereadResult(result);
    } catch (err: any) {
      setRereadResult(`Re-read failed: ${err.message || 'unknown error'}`);
    } finally {
      setRereading(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        background: 'rgba(16, 185, 129, 0.04)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: 14,
        marginTop: 12,
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sev-safe)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Verify on disk — {language === 'cypher' ? 'Neo4j Browser' : 'pgAdmin 4'}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          background: '#090d16',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}
      >
        <code
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#67e8f9',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            flex: 1,
          }}
        >
          {query}
        </code>
        <button
          onClick={handleCopy}
          title="Copy query"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            color: copied ? 'var(--sev-safe)' : 'var(--text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.72rem',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
        Expected: <span style={{ color: 'var(--text-main)' }}>{expected}</span>
      </div>

      {onReRead && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={handleReRead}
            disabled={rereading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={rereading ? 'spin-icon' : undefined} />
            {rereading ? 'Re-reading…' : 'Re-read from database'}
          </button>
          {rereadResult && (
            <div
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#a5f3fc',
                background: '#090d16',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
              }}
            >
              {rereadResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
