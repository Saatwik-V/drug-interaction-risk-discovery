import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that do not require authentication
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/login') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 1. API Route protection
  if (pathname.startsWith('/api/')) {
    // If no session found and no Authorization header present, return 401 immediately
    const authHeader = request.headers.get('authorization');
    if (!session && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Role-specific API protection: Admin endpoints
    if (pathname.startsWith('/api/admin/')) {
      const activeSession = session || (authHeader ? await verifySessionToken(authHeader.substring(7).trim()) : null);
      if (!activeSession) {
        return NextResponse.json(
          { success: false, error: 'Authentication required.' },
          { status: 401 }
        );
      }
      if (activeSession.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Forbidden. Administrative role required.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // 2. Application UI Route protection (for Day 3 Prompt 2 pages)
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect Admin UI pages
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
