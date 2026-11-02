import bcrypt from 'bcryptjs';
import { query, getAdminDclPool } from '../postgres/client';

export interface UserAccount {
  userId: number;
  username: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

interface UserRow {
  user_id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Validates credentials on the server using salted bcrypt verification.
 * Never returns the password hash.
 */
export async function authenticateUser(
  username: string,
  plainPassword: string
): Promise<UserAccount | null> {
  if (!username || !plainPassword) {
    return null;
  }

  const sql = `
    SELECT user_id, username, password_hash, full_name, role, is_active, created_at::TEXT
    FROM user_accounts
    WHERE LOWER(username) = LOWER($1) AND is_active = TRUE;
  `;
  const res = await query<UserRow>(sql, [username.trim()], 'ADMIN');
  const user = res.rows[0];

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(plainPassword, user.password_hash);
  if (!isPasswordValid) {
    return null;
  }

  return {
    userId: user.user_id,
    username: user.username,
    fullName: user.full_name,
    role: user.role as 'DOCTOR' | 'ADMIN',
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

/**
 * Retrieves an active user account by ID (excluding password hash).
 */
export async function getUserById(userId: number): Promise<UserAccount | null> {
  const sql = `
    SELECT user_id, username, full_name, role, is_active, created_at::TEXT
    FROM user_accounts
    WHERE user_id = $1 AND is_active = TRUE;
  `;
  const res = await query<Omit<UserRow, 'password_hash'>>(sql, [userId], 'ADMIN');
  const user = res.rows[0];
  if (!user) return null;

  return {
    userId: user.user_id,
    username: user.username,
    fullName: user.full_name,
    role: user.role as 'DOCTOR' | 'ADMIN',
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

/**
 * Retrieves all user accounts for administrator oversight.
 */
export async function getAllUsers(): Promise<UserAccount[]> {
  const sql = `
    SELECT user_id, username, full_name, role, is_active, created_at::TEXT
    FROM user_accounts
    ORDER BY user_id ASC;
  `;
  const res = await query<Omit<UserRow, 'password_hash'>>(sql, [], 'ADMIN');
  return res.rows.map((u) => ({
    userId: u.user_id,
    username: u.username,
    fullName: u.full_name,
    role: u.role as 'DOCTOR' | 'ADMIN',
    isActive: u.is_active,
    createdAt: u.created_at,
  }));
}

/**
 * Creates a new user account enforcing the Two-Tier Enterprise Security Architecture:
 * Tier 1: Application Profile Layer (inserts into user_accounts table)
 * Tier 2: PostgreSQL Engine DCL Layer (executes CREATE USER and GRANT role_*)
 */
export async function createUser(data: {
  username: string;
  password: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
}): Promise<UserAccount & { dclExecuted?: string[] }> {
  const normalizedUsername = data.username.trim().toLowerCase();
  if (normalizedUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  // Sanitize username to valid SQL identifier for CREATE USER
  if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
    throw new Error('Username can only contain alphanumeric characters and underscores.');
  }
  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!['DOCTOR', 'ADMIN'].includes(data.role)) {
    throw new Error("Invalid role specified. Role must be 'DOCTOR' or 'ADMIN'.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  // 1. Tier 1: Application Profile Table
  const sql = `
    INSERT INTO user_accounts (username, password_hash, full_name, role, is_active)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING user_id, username, full_name, role, is_active, created_at::TEXT;
  `;
  const res = await query<Omit<UserRow, 'password_hash'>>(
    sql,
    [normalizedUsername, passwordHash, data.fullName.trim(), data.role],
    'ADMIN'
  );
  const newUser = res.rows[0];

  // 2. Tier 2: PostgreSQL Engine DCL Execution
  //
  // NOTE: A `DO $$ ... $$` anonymous code block cannot accept bind parameters
  // ($1/$2/...) — PostgreSQL's extended query protocol only recognizes those
  // placeholders in the outer statement, not inside a dollar-quoted PL/pgSQL
  // body, so an earlier version of this function silently failed here on
  // every call (error 08P01) while still reporting success. The DCL layer
  // never actually ran. The fix: escape the password via the driver's own
  // `escapeLiteral` and interpolate plain SQL text (no bind params) into the
  // DO block. `normalizedUsername` and `dbRole` are safe to interpolate
  // directly — the former is already restricted to `[a-z0-9_]+` above, and
  // the latter is one of two hardcoded constants.
  const dclStatements: string[] = [];
  const superPool = getAdminDclPool();
  const dbRole = data.role === 'ADMIN' ? 'role_admin' : 'role_doctor';
  const dclClient = await superPool.connect();

  try {
    const escapedPassword = dclClient.escapeLiteral(data.password);
    const dclSql = `
      DO $dcl$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${normalizedUsername}') THEN
          EXECUTE format('CREATE USER %I WITH PASSWORD %L', '${normalizedUsername}', ${escapedPassword}::text);
        ELSE
          EXECUTE format('ALTER USER %I WITH PASSWORD %L', '${normalizedUsername}', ${escapedPassword}::text);
        END IF;
        EXECUTE format('GRANT %I TO %I', '${dbRole}', '${normalizedUsername}');
      END $dcl$;
    `;
    await dclClient.query(dclSql);
    dclStatements.push(`CREATE USER ${normalizedUsername} WITH PASSWORD '***';`);
    dclStatements.push(`GRANT ${dbRole} TO ${normalizedUsername};`);
  } catch (dclErr: any) {
    // Roll back the Tier 1 application row rather than reporting a "Two-Tier
    // user created" success when the Tier 2 DCL half never actually happened.
    await query(`DELETE FROM user_accounts WHERE user_id = $1;`, [newUser.user_id], 'ADMIN');
    throw new Error(`PostgreSQL DCL execution failed (CREATE USER/GRANT): ${dclErr.message}`);
  } finally {
    dclClient.release();
  }

  return {
    userId: newUser.user_id,
    username: newUser.username,
    fullName: newUser.full_name,
    role: newUser.role as 'DOCTOR' | 'ADMIN',
    isActive: newUser.is_active,
    createdAt: newUser.created_at,
    dclExecuted: dclStatements,
  };
}

/**
 * Reverses createUser(): drops the PostgreSQL engine login role (Tier 2 DCL)
 * and removes the application profile row (Tier 1), in that order so a
 * dangling pg role is never left behind even if the app-row delete fails.
 */
export async function deleteUser(username: string): Promise<{ dclExecuted: string[] }> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
    throw new Error('Username can only contain alphanumeric characters and underscores.');
  }
  const dclExecuted: string[] = [];

  // Same bind-parameter pitfall as createUser(): DO blocks cannot accept
  // $1-style parameters, so this must interpolate plain SQL text. Safe here
  // because normalizedUsername is restricted to [a-z0-9_]+ above.
  const superPool = getAdminDclPool();
  try {
    const dropSql = `
      DO $dcl$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${normalizedUsername}') THEN
          EXECUTE format('DROP OWNED BY %I', '${normalizedUsername}');
          EXECUTE format('DROP USER %I', '${normalizedUsername}');
        END IF;
      END $dcl$;
    `;
    await superPool.query(dropSql);
    dclExecuted.push(`DROP USER ${normalizedUsername};`);
  } catch (dclErr: any) {
    console.error('DCL execution error while dropping user:', dclErr);
    throw new Error(`PostgreSQL DCL execution failed (DROP USER): ${dclErr.message}`);
  }

  await query(`DELETE FROM user_accounts WHERE LOWER(username) = $1;`, [normalizedUsername], 'ADMIN');

  return { dclExecuted };
}
