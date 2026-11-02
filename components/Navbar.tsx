'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import StatusDot from '@/components/ui/StatusDot';
import CommandPalette from '@/components/ui/CommandPalette';

interface UserProfile {
  userId: number;
  username: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
}

interface SystemHealth {
  status: 'operational' | 'degraded';
  services: {
    postgres: { status: string; latencyMs: number };
    neo4j: { status: string; latencyMs: number };
  };
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [userRes, healthRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/system/health'),
        ]);

        if (userRes.ok && isMounted) {
          const userData = await userRes.json();
          if (userData.success) setUser(userData.user);
        }

        if (healthRes.ok && isMounted) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!isLoginPage) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage]);

  // Close dropdown menu on outside click or navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="app-container">
        <div className="navbar-inner">
          {/* Brand Identity */}
          <Link href="/dashboard" className="navbar-brand">
            <div className="brand-icon">Rx</div>
            <div>
              <div style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1rem' }}>
                RxGraph
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                DBMS Level 3
              </div>
            </div>
          </Link>

          {!isLoginPage && (
            <>
              {/* Primary Focused Links (Only the core daily screens) */}
              <ul className="navbar-nav">
                <li>
                  <Link
                    href="/dashboard"
                    className={`nav-link ${pathname === '/dashboard' || pathname.startsWith('/patients') ? 'active' : ''}`}
                  >
                    Patients &amp; Screening
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alerts"
                    className={`nav-link ${pathname === '/alerts' ? 'active' : ''}`}
                  >
                    Alerts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dbms-studio"
                    className={`nav-link ${pathname === '/dbms-studio' ? 'active' : ''}`}
                    style={{
                      background: pathname === '/dbms-studio' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: '#a5b4fc',
                      fontWeight: 600,
                      borderRadius: 6,
                      padding: '4px 10px',
                    }}
                  >
                    ⚡ DBMS Studio
                  </Link>
                </li>
              </ul>

              {/* Right Side: Health Strip, User Pill, and Clean Hamburger / More Menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Compact Engine Status Indicator */}
                {health && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <StatusDot
                      status={health.services.postgres.status === 'healthy' ? 'healthy' : 'down'}
                      label="PG"
                      title={
                        health.services.postgres.status === 'healthy'
                          ? `PostgreSQL :5432 — ${health.services.postgres.latencyMs}ms`
                          : 'PostgreSQL unreachable on :5432'
                      }
                    />
                    <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>/</span>
                    <StatusDot
                      status={health.services.neo4j.status === 'healthy' ? 'healthy' : 'down'}
                      label="NEO4J"
                      title={
                        health.services.neo4j.status === 'healthy'
                          ? `Neo4j :7687 — ${health.services.neo4j.latencyMs}ms`
                          : 'Neo4j unreachable on :7687'
                      }
                    />
                  </div>
                )}

                {/* Command Palette Trigger */}
                {!loading && user && (
                  <button
                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                    title="Jump to a patient, screen, or lab demo"
                  >
                    <span>Jump to…</span>
                    <kbd style={{ fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
                  </button>
                )}

                {/* User Status */}
                {loading ? (
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                ) : user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                      }}
                    >
                      {user.username}
                    </span>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-doctor'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {user.role}
                    </span>
                  </div>
                ) : (
                  <Link href="/login" className="btn btn-primary btn-sm">
                    Sign In
                  </Link>
                )}

                {/* Hamburger / Extended Controls Dropdown */}
                <div ref={menuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 4,
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: isMenuOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: isMenuOpen ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      padding: 6,
                    }}
                    title="Menu & Tools"
                  >
                    <span style={{ width: 16, height: 2, background: '#cbd5e1', borderRadius: 2 }} />
                    <span style={{ width: 16, height: 2, background: '#cbd5e1', borderRadius: 2 }} />
                    <span style={{ width: 16, height: 2, background: '#cbd5e1', borderRadius: 2 }} />
                  </button>

                  {/* Dropdown Panel */}
                  {isMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        width: 220,
                        background: '#0d1322',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 10,
                        padding: 6,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
                        zIndex: 999,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#64748b',
                          padding: '6px 10px 2px',
                        }}
                      >
                        Navigation &amp; Docs
                      </div>

                      <Link
                        href="/architecture"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          color: '#f8fafc',
                          textDecoration: 'none',
                          background: pathname === '/architecture' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        }}
                      >
                        <span>🏛️</span> Architecture Trace
                      </Link>

                      <Link
                        href="/guides"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          color: '#f8fafc',
                          textDecoration: 'none',
                          background: pathname === '/guides' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        }}
                      >
                        <span>📘</span> Viva Demo Guides
                      </Link>

                      {user?.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 6,
                            fontSize: '0.82rem',
                            color: '#f8fafc',
                            textDecoration: 'none',
                            background: pathname.startsWith('/admin') ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                          }}
                        >
                          <span>⚙️</span> Admin Console
                        </Link>
                      )}

                      <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                      <div
                        style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#64748b',
                          padding: '2px 10px',
                        }}
                      >
                        External Inspectors
                      </div>

                      <a
                        href="http://localhost:7474"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          color: '#94a3b8',
                          textDecoration: 'none',
                        }}
                      >
                        <span>Neo4j Browser (:7474)</span>
                        <span style={{ fontSize: '0.7rem' }}>↗</span>
                      </a>

                      {user && (
                        <>
                          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                          <button
                            onClick={handleLogout}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                              color: '#ef4444',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <span>🚪</span> Sign Out
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {!isLoginPage && user && <CommandPalette role={user.role} />}
    </nav>
  );
}
