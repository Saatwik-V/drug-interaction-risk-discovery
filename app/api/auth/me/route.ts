import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth/session';
import { getUserById } from '@/lib/auth/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const user = await getUserById(session.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found or deactivated.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
