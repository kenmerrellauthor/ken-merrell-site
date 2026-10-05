import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { addReader, newId, getSite } from '@/lib/store';
import { readerEmail, sendMail } from '@/lib/email';
import { headers } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default async function VerifyReaderPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;
  
  if (!token) {
    return redirect('/');
  }

  let payload;
  try {
    const secret = process.env.SESSION_SECRET || 'dev-only-secret-change-me-please-min-32-chars';
    const { payload: p } = await jwtVerify(token, new TextEncoder().encode(secret));
    payload = p as any;
  } catch (e) {
    const site = await getSite();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header active="advance" />
        <main style={{ flex: 1, padding: '150px 20px 80px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--serif-d)', fontSize: 42, color: '#1b1814', marginBottom: 24 }}>Link Expired or Invalid</h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
            Your verification link has expired or is invalid. Please try signing up again.
          </p>
          <Link href="/advance-readers" className="btn btn-dark" style={{ display: 'inline-flex' }}>
            SIGN UP AGAIN
          </Link>
        </main>
        <Footer site={site} />
      </div>
    );
  }

  const { name, email, format, agreed } = payload;
  
  // Add to DB
  const res = await addReader({ id: newId(), name, email, format, agreed, createdAt: new Date().toISOString() });
  
  // Notify admin
  const site = await getSite();
  const toEmail = site.notifyEmail || process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'upcometrends@gmail.com';
  if (toEmail) {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
    await sendMail({
      to: toEmail,
      subject: `New advance reader: ${name}`,
      html: readerEmail({ name, email, format: res.reader.format }, `${origin}/admin/readers`),
      replyTo: email
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header active="advance" />
      <main style={{ flex: 1, padding: '150px 20px 80px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#4a8858', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--serif-d)', fontSize: 42, color: '#1b1814', marginBottom: 24 }}>Email Verified!</h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
          Thank you, {name}! Your email has been verified and you've successfully joined the advance reader list. Keep an eye on your inbox for early copies of upcoming books.
        </p>
        <Link href="/books" className="btn btn-dark" style={{ display: 'inline-flex' }}>
          BROWSE KEN'S BOOKS
        </Link>
      </main>
      <Footer site={site} />
    </div>
  );
}
