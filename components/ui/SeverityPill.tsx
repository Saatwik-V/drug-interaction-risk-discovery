'use client';

import React from 'react';

interface SeverityPillProps {
  severity: 'Major' | 'Moderate' | 'Minor' | 'Safe' | 'Unknown' | string;
  size?: 'sm' | 'md';
}

export default function SeverityPill({ severity, size = 'md' }: SeverityPillProps) {
  const norm = severity?.toLowerCase() || 'unknown';

  let bg = 'rgba(139, 92, 246, 0.15)';
  let border = 'rgba(139, 92, 246, 0.4)';
  let color = '#c084fc';
  let icon = '●';

  if (norm === 'major' || norm === 'critical') {
    bg = 'rgba(239, 68, 68, 0.15)';
    border = 'rgba(239, 68, 68, 0.4)';
    color = '#f87171';
    icon = '▲';
  } else if (norm === 'moderate') {
    bg = 'rgba(245, 158, 11, 0.15)';
    border = 'rgba(245, 158, 11, 0.4)';
    color = '#fbbf24';
    icon = '◆';
  } else if (norm === 'minor') {
    bg = 'rgba(59, 130, 246, 0.15)';
    border = 'rgba(59, 130, 246, 0.4)';
    color = '#60a5fa';
    icon = '■';
  } else if (norm === 'safe' || norm === 'guarded') {
    bg = 'rgba(16, 185, 129, 0.15)';
    border = 'rgba(16, 185, 129, 0.4)';
    color = '#34d399';
    icon = '✓';
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: 9999,
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: isSmall ? '0.7rem' : '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ fontSize: isSmall ? '0.6rem' : '0.65rem' }}>{icon}</span>
      {severity}
    </span>
  );
}
