'use client';

import React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows = 3, rowHeight = 16, gap = 10 }: { rows?: number; rowHeight?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={rowHeight} width={i === rows - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton height={14} width="40%" style={{ marginBottom: 14 }} />
      <SkeletonRows rows={3} />
    </div>
  );
}
