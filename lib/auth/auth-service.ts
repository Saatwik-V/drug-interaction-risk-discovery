import bcrypt from 'bcryptjs';
import { query } from '../postgres/client';

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
  const res = await query<UserRow>(sql, [username.trim()]);
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
  const res = await query<Omit<UserRow, 'password_hash'>>(sql, [userId]);
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
  const res = await query<Omit<UserRow, 'password_hash'>>(sql);
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
 * Creates a new user account with a secure bcrypt hash (Admin privilege only).
 */
export async function createUser(data: {
  username: string;
  password: string;
  fullName: string;
  role: 'DOCTOR' | 'ADMIN';
}): Promise<UserAccount> {
  const normalizedUsername = data.username.trim().toLowerCase();
  if (normalizedUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!['DOCTOR', 'ADMIN'].includes(data.role)) {
    throw new Error("Invalid role specified. Role must be 'DOCTOR' or 'ADMIN'.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const sql = `
    INSERT INTO user_accounts (username, password_hash, full_name, role, is_active)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING user_id, username, full_name, role, is_active, created_at::TEXT;
  `;
  const res = await query<Omit<UserRow, 'password_hash'>>(sql, [
    normalizedUsername,
    passwordHash,
    data.fullName.trim(),
    data.role,
  ]);
  const newUser = res.rows[0];

  return {
    userId: newUser.user_id,
    username: newUser.username,
    fullName: newUser.full_name,
    role: newUser.role as 'DOCTOR' | 'ADMIN',
    isActive: newUser.is_active,
    createdAt: newUser.created_at,
  };
}
