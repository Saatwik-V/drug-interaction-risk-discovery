'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bell,
  Terminal,
  GitBranch,
  ShieldCheck,
  Search,
  User,
  BookOpen,
} from 'lucide-react';

interface PatientSummary {
  patient_id: number;
  mrn: string;
  full_name: string;
}

interface CommandPaletteProps {
  role: 'DOCTOR' | 'ADMIN' | null;
}

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

/**
 * Global Cmd/Ctrl+K jump list. Routes are role-aware on the client for
 * convenience only — every destination still enforces its own role check
 * server-side (see requireRole in each route handler), so hiding/showing an
 * entry here is cosmetic, never a security boundary.
 */
export default function CommandPalette({ role }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Patients are fetched lazily, only once the palette actually opens,
      // and only when a session role is known (route is gated server-side
      // regardless — this just avoids a pointless 401 round-trip on login).
      if (role && patients.length === 0) {
        fetch('/api/patients')
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setPatients(d.data);
          })
          .catch(() => {});
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, role, patients.length]);

  const staticCommands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'dashboard',
        label: 'Clinical dashboard',
        hint: 'Patient cohort & quick actions',
        icon: <LayoutDashboard size={16} />,
        action: () => router.push('/dashboard'),
      },
      {
        id: 'alerts',
        label: 'Alerts & assessment history',
        hint: 'Audit log of past screenings',
        icon: <Bell size={16} />,
        action: () => router.push('/alerts'),
      },
      {
        id: 'dbms-studio',
        label: 'DBMS Operations Studio',
        hint: 'Constraints, triggers, procedures, DCL',
        icon: <Terminal size={16} />,
        action: () => router.push('/dbms-studio'),
      },
      {
        id: 'architecture',
        label: 'Architecture trace',
        hint: 'How a screening request flows end to end',
        icon: <GitBranch size={16} />,
        action: () => router.push('/architecture'),
      },
      {
        id: 'guides',
        label: 'Viva demo guides',
        hint: 'Rubric walkthrough, rendered in-app',
        icon: <BookOpen size={16} />,
        action: () => router.push('/guides'),
      },
    ];
    if (role === 'ADMIN') {
      items.push({
        id: 'admin',
        label: 'Admin console',
        hint: 'Two-tier user management',
        icon: <ShieldCheck size={16} />,
        action: () => router.push('/admin'),
      });
    }
    return items;
  }, [role, router]);

  const patientCommands: CommandItem[] = useMemo(
    () =>
      patients.map((p) => ({
        id: `patient-${p.patient_id}`,
        label: p.full_name,
        hint: p.mrn,
        icon: <User size={16} />,
        action: () => router.push(`/patients/${p.patient_id}`),
      })),
    [patients, router]
  );

  const filtered = useMemo(() => {
    const all = [...staticCommands, ...patientCommands];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q)
    );
  }, [staticCommands, patientCommands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const runItem = (item: CommandItem) => {
    item.action();
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 15, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '14vh',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '90vw',
          maxHeight: '60vh',
          background: '#0d1322',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a patient, screen, or lab demo…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              fontFamily: 'var(--font-sans)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && filtered[activeIndex]) {
                e.preventDefault();
                runItem(filtered[activeIndex]);
              }
            }}
          />
          <kbd
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Esc
          </kbd>
        </div>

        <div style={{ overflowY: 'auto', padding: 6 }} role="listbox">
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matches for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => runItem(item)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: i === activeIndex ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                  color: 'var(--text-main)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                <span style={{ color: i === activeIndex ? '#a5b4fc' : 'var(--text-muted)', display: 'flex' }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.hint && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {item.hint}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
