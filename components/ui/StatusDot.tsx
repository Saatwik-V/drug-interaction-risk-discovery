'use client';

import React from 'react';

interface StatusDotProps {
  status: 'healthy' | 'degraded' | 'down';
  label: string;
  pulse?: boolean;
  title?: string;
}

export default function StatusDot({ status, label, pulse = false, title }: StatusDotProps) {
  return (
    <span className="status-dot" title={title}>
      <span className={`status-dot-indicator ${status}${pulse ? ' pulse' : ''}`} />
      {label}
    </span>
  );
}
