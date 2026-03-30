import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { comparePassword, setSessionCookie } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      console.log("no user")
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      console.log("Password error")
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set session cookie
    await setSessionCookie(user.id);

    return NextResponse.json(
      { message: 'Login successful', user: { id: user.id, email: user.email, name: user.first_name } },
      { status: 200 }
    );
  } catch (error) {
    console.log('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
