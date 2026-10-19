import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || 'dev_local_secret_key_dbms_mini_project_2026_pes_auth_token_key'
);

export interface SessionPayload {
  userId: number;
  username: string;
  role: 'DOCTOR' | 'ADMIN';
  fullName: string;
}

export const SESSION_COOKIE_NAME = 'drug_interaction_session';

/**
 * Creates a signed JWT session token with a 24-hour expiration.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    fullName: payload.fullName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token and returns the decoded payload, or null if invalid/expired.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.userId === 'number' &&
      typeof payload.username === 'string' &&
      typeof payload.role === 'string' &&
      (payload.role === 'DOCTOR' || payload.role === 'ADMIN')
    ) {
      return {
        userId: payload.userId,
        username: payload.username,
        role: payload.role as 'DOCTOR' | 'ADMIN',
        fullName: (payload.fullName as string) || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}
