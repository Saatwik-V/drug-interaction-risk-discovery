'use client';

import React from 'react';

interface KeyValueItem {
  key: string;
  value: React.ReactNode;
}

export default function KeyValue({ items }: { items: KeyValueItem[] }) {
  return (
    <div className="kv-grid">
      {items.map((item) => (
        <React.Fragment key={item.key}>
          <span className="kv-key">{item.key}</span>
          <span className="kv-value">{item.value}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
