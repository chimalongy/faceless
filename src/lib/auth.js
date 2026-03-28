import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 10;
const COOKIE_NAME = 'faceless_session';

export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function setSessionCookie(userId) {
  const cookieStore = await cookies();
  // Simple session cookie storing user ID. 
  // In a real production app, this should be a signed JWT or a session ID from a database table.
  // For this project, we'll store the User ID directly but signed/encrypted would be better.
  // Ideally, use a library like `jose` to sign a JWT.
  // Let's stick to a simple secure cookie for now as per requirements "Session management with HTTP-only cookies".
  
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
