import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center', padding: 20 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 44, width: 'auto' }} />
      <h1 className="h1">This page <em>is missing</em></h1>
      <p style={{ color: 'var(--muted)', fontSize: 18 }}>The book you were looking for may have moved.</p>
      <Link href="/books" className="btn btn-gold">BROWSE ALL BOOKS</Link>
    </main>
  );
}
