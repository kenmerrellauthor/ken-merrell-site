import { NextResponse, type NextRequest } from 'next/server';
import { checkCredentials, checkLoginRateLimit, createSession, recordLoginAttempt } from '@/lib/auth';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many tries. Please wait ${rateLimit.waitMinutes} minutes before trying again.` },
      { status: 429 }
    );
  }

  try {
    let email = '';
    let password = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await req.json();
      email = String(data.email || '').trim().slice(0, 200);
      password = String(data.password || '').slice(0, 200);
    } else {
      const form = await req.formData();
      email = String(form.get('email') || '').trim().slice(0, 200);
      password = String(form.get('password') || '').slice(0, 200);
    }

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Please enter both your email and password.' },
        { status: 400 }
      );
    }

    if (!checkCredentials(email, password)) {
      recordLoginAttempt(ip, false);
      return NextResponse.json(
        { ok: false, error: 'That email and password do not match.' },
        { status: 401 }
      );
    }

    recordLoginAttempt(ip, true);
    await createSession(email);

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

