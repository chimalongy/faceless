import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'faceless_admin_session';
const ADMIN_SECRET = 'admin-authenticated'; // simple token value

export async function setAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, ADMIN_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });
}

export async function getAdminCookie() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return session?.value === ADMIN_SECRET ? true : false;
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
