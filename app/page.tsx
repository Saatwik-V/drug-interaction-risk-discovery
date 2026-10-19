import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
