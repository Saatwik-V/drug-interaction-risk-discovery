'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state-panel">
      <span className="empty-state-panel-icon">
        <Icon size={20} />
      </span>
      <span className="empty-state-panel-title">{title}</span>
      {description && <span className="empty-state-panel-desc">{description}</span>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
