import { NextResponse } from 'next/server';

const ADMIN_COOKIE  = 'faceless_admin_session';
const ADMIN_SECRET  = 'admin-authenticated';

export function middleware(request) {
  const session      = request.cookies.get('faceless_session');
  const adminSession = request.cookies.get(ADMIN_COOKIE);
  const isAdminAuth  = adminSession?.value === ADMIN_SECRET;

  const path = request.nextUrl.pathname;

  // ── User dashboard — requires user session ──────────────────────────────
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ── Redirect already-logged-in users away from login/register ──────────
  if ((path === '/login' || path === '/register') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── Admin dashboard — requires admin session ────────────────────────────
  if (path.startsWith('/admin/dashboard')) {
    if (!isAdminAuth) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ── Redirect already-authenticated admin away from login ────────────────
  if (path === '/admin/login' && isAdminAuth) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/admin/dashboard/:path*',
    '/admin/login',
  ],
};
