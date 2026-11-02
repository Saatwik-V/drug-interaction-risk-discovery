'use client';

import React from 'react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

export default function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="tooltip-wrapper" tabIndex={0}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}
