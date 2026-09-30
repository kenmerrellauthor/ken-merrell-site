import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const config = {
  matcher: ['/admin/:path*']
};

export async function middleware(req: NextRequest) {
  // Allow login page without authentication
  if (req.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('km_admin')?.value;
  const secretEnv = process.env.SESSION_SECRET;

  // In production, reject access if secret is missing or too short
  if (process.env.NODE_ENV === 'production' && (!secretEnv || secretEnv.length < 16)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const secretKey = new TextEncoder().encode(secretEnv || 'dev-only-secret-change-me-please-min-32-chars');

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (payload.role === 'admin') {
        const res = NextResponse.next();
        res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return res;
      }
    } catch {
      // Invalid or expired token: proceed to redirect below
    }
  }

  return NextResponse.redirect(new URL('/admin/login', req.url));
}

