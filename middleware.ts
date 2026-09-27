import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const config = { matcher: ['/admin/:path*'] };

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin/login')) return NextResponse.next();
  const token = req.cookies.get('km_admin')?.value;
  const s = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16 ? process.env.SESSION_SECRET : 'dev-only-secret-change-me-please';
  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(s));
      if (payload.role === 'admin') {
        const res = NextResponse.next();
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
      }
    } catch {
      /* fall through */
    }
  }
  return NextResponse.redirect(new URL('/admin/login', req.url));
}
