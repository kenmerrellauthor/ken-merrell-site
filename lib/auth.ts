import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'km_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getSessionSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable must be set with at least 16 characters in production.');
    }
    return new TextEncoder().encode('dev-only-secret-change-me-please-min-32-chars');
  }
  return new TextEncoder().encode(s);
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// In-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return { allowed: true };

  const now = Date.now();
  if (attempt.lockedUntil > now) {
    const waitMinutes = Math.max(1, Math.ceil((attempt.lockedUntil - now) / 60000));
    return { allowed: false, waitMinutes };
  }

  // Lockout expired, reset
  if (attempt.lockedUntil > 0 && attempt.lockedUntil <= now) {
    loginAttempts.delete(ip);
  }
  return { allowed: true };
}

export function recordLoginAttempt(ip: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(ip, attempt);
}

export function checkCredentials(email: string, password: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const configuredEmail = (process.env.ADMIN_EMAIL || 'ken@example.com').trim().toLowerCase();
  const configuredPassword = (process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? '123' : '')).trim();

  if (!configuredPassword) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: ADMIN_PASSWORD environment variable is not configured.');
    }
    return false;
  }

  // Constant-time check for both email and password to prevent timing attacks
  const emailMatches = safeEqual(cleanEmail, configuredEmail);
  const passwordMatches = safeEqual(cleanPassword, configuredPassword);

  return emailMatches && passwordMatches;
}

export async function createSession(email: string) {
  const token = await new SignJWT({ sub: email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSessionSecret());

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

export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload.role === 'admin' ? (payload.sub as string) : null;
  } catch {
    return null;
  }
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<string> {
  const who = await verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!who) redirect('/admin/login');
  return who;
}

