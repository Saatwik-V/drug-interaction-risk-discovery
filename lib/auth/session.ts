import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SessionPayload, SESSION_COOKIE_NAME } from './jwt';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Extracts and verifies the session token from request cookies or Authorization header.
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  // 1. Check HttpOnly cookie
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) return session;
  }

  // 2. Check Authorization Bearer header (for API integration tests or programmatic clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    const session = await verifySessionToken(bearerToken);
    if (session) return session;
  }

  return null;
}

/**
 * Enforces that a request has a valid authenticated session.
 * Throws AuthError(401) if unauthenticated.
 */
export async function requireAuth(request: NextRequest): Promise<SessionPayload> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new AuthError('Authentication required. Please log in.', 401);
  }
  return session;
}

/**
 * Enforces role-based authorization for the specified allowed roles.
 * Throws AuthError(401) if unauthenticated, or AuthError(403) if role is insufficient.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: ('DOCTOR' | 'ADMIN')[]
): Promise<SessionPayload> {
  const session = await requireAuth(request);

  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(
      `Access denied. Requires role: ${allowedRoles.join(' or ')}. Your role: ${session.role}`,
      403
    );
  }

  return session;
}

/**
 * Helper to build standard structured JSON error responses for AuthError.
 */
export function handleAuthError(error: any): NextResponse {
  if (
    error instanceof AuthError ||
    error?.name === 'AuthError' ||
    typeof error?.statusCode === 'number'
  ) {
    const status = error.statusCode || 401;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Authentication error.',
      },
      { status }
    );
  }
  return NextResponse.json(
    {
      success: false,
      error: error.message || 'Internal server error.',
    },
    { status: 500 }
  );
}
