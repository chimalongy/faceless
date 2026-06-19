import { NextResponse } from 'next/server';
import { setAdminCookie } from '../../../../lib/adminAuth';

// ── Hardcoded admin credentials ───────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@facelessstudio.com';
const ADMIN_PASSWORD = 'FacelessAdmin2025!';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        { status: 401 }
      );
    }

    await setAdminCookie();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
