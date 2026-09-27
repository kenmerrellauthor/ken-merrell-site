import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'km_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // one week

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be set (16+ characters).');
    return new TextEncoder().encode('dev-only-secret-change-me-please');
  }
  return new TextEncoder().encode(s);
}

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(email: string, password: string) {
  const e = process.env.ADMIN_EMAIL || (process.env.NODE_ENV !== 'production' ? 'ken@example.com' : '');
  const p = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'admin' : '');
  if (!e || !p) return false;
  const okEmail = safeEqual(email.trim().toLowerCase(), e.trim().toLowerCase());
  const okPass = safeEqual(password, p);
  return okEmail && okPass;
}

export async function createSession(email: string) {
  const token = await new SignJWT({ sub: email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function verifyToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === 'admin' ? (payload.sub as string) : null;
  } catch {
    return null;
  }
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  const who = await verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!who) redirect('/admin/login');
  return who;
}
