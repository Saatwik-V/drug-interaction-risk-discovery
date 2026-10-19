import { NextRequest, NextResponse } from 'next/server';
import { requireRole, handleAuthError } from '@/lib/auth/session';
import { getAllUsers, createUser } from '@/lib/auth/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Strictly restrict to ADMIN role
    await requireRole(request, ['ADMIN']);

    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Strictly restrict to ADMIN role
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { username, password, fullName, role } = body || {};

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: username, password, fullName, role.',
        },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      username,
      password,
      fullName,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Account '${newUser.username}' created successfully.`,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === '23505') {
      // PostgreSQL unique_violation error code
      return NextResponse.json(
        { success: false, error: 'Username already exists.' },
        { status: 409 }
      );
    }
    return handleAuthError(error);
  }
}
