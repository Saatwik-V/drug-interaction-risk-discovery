'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  sqlCode?: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, item]);

    const duration = toast.durationMs || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 420,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          const borderColor = isError
            ? '#ef4444'
            : isSuccess
            ? '#10b981'
            : isWarning
            ? '#f59e0b'
            : '#6366f1';

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                padding: '14px 18px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                color: '#f8fafc',
                fontSize: '0.875rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                animation: 'slideIn 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: borderColor }}>
                  {isError ? '🛡️ ' : isSuccess ? '✅ ' : isWarning ? '⚠️ ' : 'ℹ️ '}
                  {t.title}
                </span>
                <button
                  onClick={() => removeToast(t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  ✕
                </button>
              </div>
              {t.message && <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>{t.message}</div>}
              {t.sqlCode && (
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    color: '#38bdf8',
                  }}
                >
                  SQLState: {t.sqlCode}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
