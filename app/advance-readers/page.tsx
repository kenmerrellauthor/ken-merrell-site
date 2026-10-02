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

export default async function AdvanceReadersPage() {
  const [site, books] = await Promise.all([getSite(), getBooks()]);
  const coming = books.find((b) => b.status === 'coming');

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
              <div style={{ marginTop: 28, padding: '20px 24px', background: 'rgba(201,168,96,.1)', border: '1px solid rgba(201,168,96,.3)', borderRadius: 4 }}>
                <span style={{ fontFamily: 'var(--serif-c)', fontSize: 10, letterSpacing: '.24em', color: 'var(--gold)', fontWeight: 700 }}>NEXT UPCOMING TITLE</span>
                <p style={{ margin: '6px 0 0', fontFamily: 'var(--serif-d)', fontSize: 24, fontStyle: 'italic', color: '#f4ecdc' }}>{coming.title}</p>
                {coming.releaseLabel && <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>Expected {coming.releaseLabel}</span>}
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
