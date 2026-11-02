'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, FileText } from 'lucide-react';
import { SkeletonRows } from '@/components/ui/Skeleton';

type GuideKey = 'enhanced' | 'final';

const GUIDE_TABS: { key: GuideKey; label: string; hint: string }[] = [
  { key: 'enhanced', label: 'Enhanced Guide', hint: 'Frontend-first, with everything fixed this pass' },
  { key: 'final', label: 'Original Guide', hint: 'pgAdmin / Neo4j Browser-first reference' },
];

export default function GuidesPage() {
  const [active, setActive] = useState<GuideKey>('enhanced');
  const [html, setHtml] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch(`/api/guides?doc=${active}`)
      .then((r) => r.json())
      .then((d) => {
        if (!isMounted) return;
        if (d.success) {
          setHtml(d.html);
          setSourcePath(d.sourcePath);
        } else {
          setError(d.error || 'Failed to load guide.');
        }
      })
      .catch(() => isMounted && setError('Could not reach the guide service.'))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [active]);

  return (
    <div className="app-container">
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <span className="badge badge-doctor" style={{ marginBottom: 8, display: 'inline-block' }}>
          Reference documentation
        </span>
        <h1 className="hero-title">Viva Demonstration Guides</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6, maxWidth: 620 }}>
          The same rubric walkthrough you'd otherwise read from a Markdown file in an editor —
          rendered here so it's one tab away during a live demo, not a context switch.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {GUIDE_TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: isActive ? '1px solid #7c6cf5' : '1px solid var(--border-subtle)',
                background: isActive ? 'rgba(124, 108, 245, 0.12)' : 'var(--bg-surface)',
                color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.key === 'enhanced' ? <BookOpen size={18} /> : <FileText size={18} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tab.label}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{tab.hint}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: '36px 40px' }}>
        {sourcePath && !loading && (
          <div
            style={{
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              marginBottom: 24,
              textAlign: 'right',
            }}
          >
            Source: {sourcePath}
          </div>
        )}

        {loading ? (
          <div className="markdown-reader">
            <SkeletonRows rows={6} rowHeight={18} gap={14} />
          </div>
        ) : error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : (
          <div className="markdown-reader" dangerouslySetInnerHTML={{ __html: html || '' }} />
        )}
      </div>
    </div>
  );
}
