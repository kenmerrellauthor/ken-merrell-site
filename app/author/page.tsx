import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eyebrow } from '@/components/Bits';
import { Arrow, ArrowLeft, Person, SocialIcon } from '@/components/icons';
import { getBooks, getSite } from '@/lib/store';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About the Author',
  description: 'Learn more about novelist Ken Merrell, his background, writing journey, and published historical suspense novels.',
  alternates: { canonical: '/author' },
  openGraph: {
    title: 'About Ken Merrell · Novelist & Author',
    description: 'Learn more about novelist Ken Merrell, his background, writing journey, and published historical suspense novels.',
    url: '/author',
    type: 'profile',
    images: [{ url: '/img/banners/ash.jpg', width: 1200, height: 630, alt: 'Ken Merrell — Author' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Ken Merrell · Novelist & Author',
    description: 'Learn more about novelist Ken Merrell, his background, writing journey, and published historical suspense novels.',
    images: ['/img/banners/ash.jpg']
  }
};

export default async function AuthorPage() {
  const [site, books] = await Promise.all([getSite(), getBooks()]);
  const bio = site.bio.split(/\n\s*\n/).filter(Boolean);
  const availableBooks = books.filter((b) => b.status === 'available');

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Header active="author" />
        <section
          className="author-hero"
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
            <Eyebrow text="THE AUTHOR" />
            <h1 className="h1" style={{ margin: 0 }}>About <em>Ken Merrell</em></h1>
          </div>
        </section>
      </div>

      <main>
        <section className="about" style={{ paddingTop: 30, borderTop: 'none' }}>
          <div className="portrait">
            <div className="frame" />
            <div className="ph">
              <div className="km-grain abs" style={{ opacity: 0.7 }} />
              {site.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.photo} alt="Ken Merrell" />
              ) : (
                <>
                  <Person />
                  <span>[AUTHOR PHOTO]</span>
                </>
              )}
            </div>
            <div className="name">KEN MERRELL</div>
          </div>
          <div className="copy">
            <Eyebrow text="BIOGRAPHY &amp; CRAFT" />
            {site.pullQuote && <p className="pull">“{site.pullQuote}”</p>}
            <div className="bio">
              {bio.map((p, k) => (
                <p key={k}>{p}</p>
              ))}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell Signature" className="sig" />

            <div style={{ display: 'flex', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/books" className="btn btn-gold">
                EXPLORE ALL {availableBooks.length} BOOKS <Arrow />
              </Link>
              <Link href="/#contact" className="btn btn-ghost">
                WRITE TO KEN
              </Link>
            </div>
            
            {site.socialLinks && site.socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--serif-c)', fontSize: 11, fontWeight: 600, letterSpacing: '.18em', color: 'var(--muted)', textTransform: 'uppercase' }}>Connect:</span>

                {site.socialLinks?.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="btn-social" title={link.platform}>
                    <SocialIcon platform={link.platform} s={18} /> {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer site={site} />
    </>
  );
}
