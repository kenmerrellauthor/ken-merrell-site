import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eyebrow } from '@/components/Bits';
import { AdvanceForm } from '@/components/Forms';
import { ArrowLeft } from '@/components/icons';
import { getBooks, getSite } from '@/lib/store';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Become an Advance Reader',
  description: 'Join Ken Merrell’s advance reader team to receive early review copies (ARCs) before launch day in exchange for an honest review.',
  alternates: { canonical: '/advance-readers' },
  openGraph: {
    title: 'Become an Advance Reader · Ken Merrell',
    description: 'Join Ken Merrell’s advance reader team to receive early review copies (ARCs) before launch day in exchange for an honest review.',
    url: '/advance-readers',
    type: 'website',
    images: [{ url: '/img/banners/ash.jpg', width: 1200, height: 630, alt: 'Advance Reader Copies · Ken Merrell' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become an Advance Reader · Ken Merrell',
    description: 'Join Ken Merrell’s advance reader team to receive early review copies (ARCs) before launch day in exchange for an honest review.',
    images: ['/img/banners/ash.jpg']
  }
};

export default async function AdvanceReadersPage({
  searchParams
}: {
  searchParams?: Promise<{ book?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const [site, books] = await Promise.all([getSite(), getBooks()]);
  const comingBooks = books.filter((b) => b.status === 'coming');
  const matched = resolvedParams.book ? comingBooks.find((b) => b.slug === resolvedParams.book) : null;
  const coming = matched || comingBooks[0] || books.find((b) => b.status === 'coming');

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Header active="advance" />
        <section
          style={{
            paddingTop: 150,
            paddingBottom: 40,
            paddingLeft: 'var(--pad)',
            paddingRight: 'var(--pad)',
            position: 'relative'
          }}
        >
          <div className="km-hero-scrim abs" />
          <div className="km-grain abs" style={{ opacity: 0.5 }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Link
              href="/"
              className="back"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--serif-c)',
                fontSize: 11,
                letterSpacing: '.2em',
                color: 'var(--muted)'
              }}
            >
              <ArrowLeft s={14} /> BACK TO HOME
            </Link>
            <Eyebrow text="ADVANCE READERS PROGRAM" />
            <h1 className="h1" style={{ margin: 0 }}>
              Become an <em>Advance Reader</em>
            </h1>
          </div>
        </section>
      </div>

      <main>
        <section className="advance" style={{ borderTop: 'none', minHeight: 'auto', paddingTop: 20 }}>
          <div className="km-paper abs" />
          <div className="copy">
            <Eyebrow text="EXCLUSIVE EARLY ACCESS" dark />
            <h2>Read the next novel<br /><em>before anyone else.</em></h2>
            <p className="lead">
              Join Ken Merrell’s advance review team. You receive a complimentary early copy of each new novel weeks ahead of official publication, and in return you leave an honest review when it launches.
            </p>
            <div className="steps">
              <div><b>i.</b><span>Sign up in under a minute with your preferred format</span></div>
              <div><b>ii.</b><span>Receive your digital or print ARC before release</span></div>
              <div><b>iii.</b><span>Share an honest review on launch day</span></div>
            </div>
            {coming && (
              <div
                style={{
                  marginTop: 28,
                  padding: '22px 26px',
                  background: 'rgba(27, 24, 20, 0.04)',
                  border: '1px solid rgba(138, 107, 45, 0.3)',
                  borderLeft: '3px solid #7a5f25',
                  borderRadius: 4
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--serif-c)',
                    fontSize: 11,
                    letterSpacing: '.22em',
                    color: '#7a5f25',
                    fontWeight: 700
                  }}
                >
                  NEXT UPCOMING TITLE
                </span>
                <p
                  style={{
                    margin: '8px 0 6px',
                    fontFamily: 'var(--serif-d)',
                    fontSize: 26,
                    fontStyle: 'italic',
                    color: '#1a1612',
                    lineHeight: 1.25,
                    fontWeight: 600
                  }}
                >
                  {coming.title}
                </p>
                {coming.releaseLabel && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--serif-b)',
                      fontSize: 13,
                      color: '#5a5247',
                      letterSpacing: '.03em',
                      fontWeight: 500
                    }}
                  >
                    Expected {coming.releaseLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="ar-wrap">
            <div className="ar-seal seal km-seal"><div className="ring" style={{ width: '78%', height: '78%', fontSize: 26 }}>KM</div></div>
            <AdvanceForm bookTitle={coming?.title} />
          </div>
        </section>
      </main>

      <Footer site={site} />
    </>
  );
}
