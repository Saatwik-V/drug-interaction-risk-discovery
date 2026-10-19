'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface UserProfile {
  userId: number;
  username: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Do not show full navbar on login page
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setUser(data.user);
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!isLoginPage) {
      loadUser();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <nav className="navbar">
      <div className="app-container">
        <div className="navbar-inner">
          <Link href="/dashboard" className="navbar-brand">
            <div className="brand-icon">Rx</div>
            <div>
              <div>RxGraph Risk Discovery</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                PES University DBMS Level 3
              </div>
            </div>
          </Link>

          {!isLoginPage && (
            <>
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
                    Alerts &amp; Audits
                  </Link>
                </li>
                {user?.role === 'ADMIN' && (
                  <li>
                    <Link
                      href="/admin"
                      className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
                    >
                      Admin Console
                    </Link>
                  </li>
                )}
              </ul>

              <div className="navbar-user">
                {loading ? (
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                ) : user ? (
                  <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.fullName}</div>
                      <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-doctor'}`}>
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn btn-secondary btn-sm"
                      title="Log out of session"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="btn btn-primary btn-sm">
                    Sign In
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
