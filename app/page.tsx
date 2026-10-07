import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import QuoteCarousel from '@/components/QuoteCarousel';
import VideoGrid from '@/components/Videos';
import Countdown from '@/components/Countdown';
import { ContactForm } from '@/components/Forms';
import { Cover, Eyebrow, Seal } from '@/components/Bits';
import { Case, Cubby, SoonCubby, EmptyCubby } from '@/components/Shelf';
import { Arrow, Ext, SocialIcon } from '@/components/icons';
import ScrollReveal from '@/components/ScrollReveal';
import { getBooks, getSite, getVideos, isBookNew } from '@/lib/store';

export const revalidate = 60;

export default async function Home() {
  const [books, videos, site] = await Promise.all([getBooks(), getVideos(), getSite()]);
  const available = books.filter((b) => b.status === 'available');
  const coming = books.find((b) => b.status === 'coming') || {
    id: 'b8',
    slug: 'upcoming',
    title: '[Upcoming title]',
    displayTitle: '[Upcoming title]',
    tagline: 'A new historical novel from Ken Merrell. Join the Advance Readers to get an early copy.',
    description: '',
    genre: 'Historical Fiction · A novel',
    status: 'coming' as const,
    featured: false,
    isNew: false,
    cover: null,
    banner: null,
    clothColor: '#120f0c',
    amazonUrl: '',
    audibleUrl: '',
    published: 'Fall 2026',
    pages: '',
    formats: 'Print, Ebook',
    isbn: '',
    quotes: [],
    chapterTitle: '',
    sample: '',
    releaseDate: '2027-04-15',
    releaseLabel: 'Spring 2027',
    order: 8,
  };
  // Respect "In homepage banner" (featured: true); fallback to latest available books if none explicitly featured
  const featured = available.filter((b) => b.featured);
  const hero = featured.length ? featured.slice(0, 4) : available.slice(0, 4);
  // Build a balanced, symmetrical bookcase without orphan or distorted cubbies:
  // - 1-3 books: show books + SoonCubby + EmptyCubby to complete a full 4-cubby row.
  // - exactly 4 books: show all 4 books in a complete, full 4-cubby row.
  // - 5-7 books: show books + SoonCubby + EmptyCubby to complete 2 full 4-cubby rows (8 cubbies total).
  // - 8+ books: show the 8 latest books across 2 full 4-cubby rows.
  let shelfCubbies: React.ReactNode[] = [];
  if (available.length < 4) {
    shelfCubbies = [
      ...available.map((b, k) => <Cubby key={b.id} book={b} no={k + 1} isNew={Boolean(b.isNew)} />),
      <SoonCubby key="soon" href="/#coming" label={coming.releaseLabel || 'More to come'} />
    ];
    while (shelfCubbies.length < 4) {
      shelfCubbies.push(<EmptyCubby key={`empty-${shelfCubbies.length}`} />);
    }
  } else if (available.length === 4) {
    shelfCubbies = available.map((b, k) => <Cubby key={b.id} book={b} no={k + 1} isNew={Boolean(b.isNew)} />);
  } else if (available.length < 8) {
    shelfCubbies = [
      ...available.slice(0, 7).map((b, k) => <Cubby key={b.id} book={b} no={k + 1} isNew={Boolean(b.isNew)} />),
      <SoonCubby key="soon" href="/#coming" label={coming.releaseLabel || 'More to come'} />
    ];
    while (shelfCubbies.length < 8) {
      shelfCubbies.push(<EmptyCubby key={`empty-${shelfCubbies.length}`} />);
    }
  } else {
    shelfCubbies = available.slice(0, 8).map((b, k) => <Cubby key={b.id} book={b} no={k + 1} isNew={Boolean(b.isNew)} />);
  }
  const roman = ['I.', 'II.', 'III.', 'IV.'];

  return (
    <>
      <ScrollReveal />
      <div style={{ position: 'relative' }}>
        <Header active="home" />
        <HeroCarousel books={hero} />
      </div>

      <QuoteCarousel quotes={site.homeQuotes} />

      {/* I · THE BOOKS */}
      <section id="books" className="section-books">
        <div className="sec-head reveal-on-scroll">
          <div className="l">
            <Eyebrow num={roman[0]} text="THE BOOKS" />
            <h2 className="h2">Every novel, <em>in one place</em></h2>
          </div>
          <Link href="/books" className="btn btn-gold">BROWSE ALL BOOKS <Arrow /></Link>
        </div>
        <div className="reveal-on-scroll reveal-delay-1">
          <Case cols4>
            {shelfCubbies}
          </Case>
        </div>
      </section>

      {/* II · COMING SOON */}
      <section id="coming" className="coming">
          <div className="km-grain abs" style={{ opacity: 0.5 }} />
          <div className="ghost" aria-hidden>Soon</div>
          <div className="copy reveal-on-scroll">
            <Eyebrow num={roman[1]} text="COMING SOON" />
            <h2>{coming.title}</h2>
            {coming.tagline && <p className="teaser">{coming.tagline}</p>}
            <Countdown date={coming.releaseDate} />
            <div className="cta-row">
              <Link href="/advance-readers" className="btn btn-gold" style={{ boxShadow: 'none' }}>BECOME AN ADVANCED READER</Link>
              <span>Join the Advance Readers for a copy before release.</span>
            </div>
          </div>
          <div className="soon-cover reveal-on-scroll reveal-delay-2">
            <div className="km-gold-glow" style={{ position: 'absolute', left: -160, right: -160, top: -100, bottom: -100 }} />
            <div className="pages km-pages" />
            <div className="face">
              {coming.cover ? (
                <Cover book={coming} w={380} h={570} />
              ) : (
                <>
                  <div className="km-linen abs" />
                  <div style={{ position: 'absolute', inset: 18, border: '1px solid rgba(201,168,96,.7)' }} />
                  <div style={{ position: 'absolute', inset: 24, border: '1px solid rgba(201,168,96,.28)' }} />
                  <div style={{ position: 'absolute', inset: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '15% 20px 11%', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--serif-c)', fontSize: 12, letterSpacing: '.4em', color: '#a89d88' }}>A NEW NOVEL</span>
                    <Seal size={132} font={34} />
                    <span style={{ fontFamily: 'var(--serif-c)', fontSize: 12, letterSpacing: '.4em', color: '#a89d88' }}>COVER REVEAL SOON</span>
                  </div>
                </>
              )}
              <div className="km-spine abs" />
            </div>
          </div>
        </section>

      {/* III · VIDEOS */}
      {videos.length > 0 && (
        <section id="videos" className="videos">
          <div className="sec-head reveal-on-scroll">
            <div className="l">
              <Eyebrow num={roman[2]} text="WATCH" />
              <h2 className="h2">Readings, interviews <em>&amp; trailers</em></h2>
            </div>
            {site.youtubeUrl && (
              <a href={site.youtubeUrl} target="_blank" rel="noopener noreferrer" className="link-underline">VISIT THE YOUTUBE CHANNEL <Ext /></a>
            )}
          </div>
          <div className="reveal-on-scroll reveal-delay-1">
            <VideoGrid videos={videos.slice(0, 3)} />
          </div>
        </section>
      )}

      {/* IV · CONTACT */}
      <section id="contact" className="contact">
        <div className="contact-inner">
          <div className="contact-left reveal-on-scroll">
            <Eyebrow num={roman[3]} text="CONTACT" />
            <h2>Write <em>to Ken</em></h2>
            <p>Have a question, a thought, or just want to say hello? Ken reads every message and does his best to reply.</p>
            <div className="contact-perks">
              <div className="contact-perk">
                <span className="contact-perk-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <span>Ken reads every message personally.</span>
              </div>
              <div className="contact-perk">
                <span className="contact-perk-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <span>Replies typically arrive within a few days.</span>
              </div>
              <div className="contact-perk">
                <span className="contact-perk-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
                <span>Book clubs &amp; reading groups are always welcome.</span>
              </div>
            </div>
          </div>
          <div className="contact-right reveal-on-scroll reveal-delay-1">
            <h3>Send a message</h3>
            <ContactForm />
          </div>
        </div>
      </section>

      {(site.youtubeUrl || site.amazonAuthorUrl || (site.socialLinks && site.socialLinks.length > 0)) && (
        <section className="social-band" style={{ padding: '100px 20px', borderTop: '1px solid rgba(201,168,96,.18)', textAlign: 'center', background: '#0a0806', position: 'relative', overflow: 'hidden' }}>
          <div className="km-grain abs" style={{ opacity: 0.3 }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--serif-d)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, color: 'var(--cream-2)', margin: '0 0 16px', lineHeight: 1 }}>
              <em>Connect</em> with Ken
            </h2>
            <p style={{ margin: '0 auto 48px', fontSize: '18px', color: 'var(--muted-2)', maxWidth: '440px', lineHeight: 1.6 }}>
              Follow across the web for the latest updates, upcoming releases, and behind-the-scenes looks.
            </p>
          </div>
          <div className="social-scroller" style={{ position: 'relative', zIndex: 1 }}>
            {site.youtubeUrl && (
              <a href={site.youtubeUrl} target="_blank" rel="noopener noreferrer" className="social-card" title="YouTube">
                <div className="social-card-bg" style={{ backgroundImage: `url(${videos[0]?.thumbnail || books[0]?.banner || books[0]?.cover || ''})` }} />
                <div className="social-card-gradient" />
                <div className="social-card-content">
                  <div className="social-card-icon"><SocialIcon platform="YouTube" s={24} /></div>
                  <div className="social-card-name">
                    YouTube
                  </div>
                </div>
              </a>
            )}
            {site.amazonAuthorUrl && (
              <a href={site.amazonAuthorUrl} target="_blank" rel="noopener noreferrer" className="social-card" title="Amazon">
                <div className="social-card-bg" style={{ background: '#080605', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '10%', right: '-20%', opacity: 0.03, transform: 'scale(6)' }}>
                    <SocialIcon platform="Amazon" s={100} />
                  </div>
                </div>
                <div className="social-card-gradient" />
                <div className="social-card-content">
                  <div className="social-card-icon"><SocialIcon platform="Amazon" s={24} /></div>
                  <div className="social-card-name">
                    Amazon
                  </div>
                </div>
              </a>
            )}
            {site.socialLinks?.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="social-card" title={link.platform}>
                <div className="social-card-bg" style={link.image ? { backgroundImage: `url(${link.image})` } : { background: '#080605', overflow: 'hidden' }}>
                  {!link.image && (
                    <div style={{ position: 'absolute', top: '10%', right: '-20%', opacity: 0.03, transform: 'scale(6)' }}>
                      <SocialIcon platform={link.platform} s={100} />
                    </div>
                  )}
                </div>
                <div className="social-card-gradient" />
                <div className="social-card-content">
                  <div className="social-card-icon"><SocialIcon platform={link.platform} s={24} /></div>
                  <div className="social-card-name">
                    {link.platform}
                  </div>
                </div>
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--muted)', fontSize: '13px', alignItems: 'center', gap: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', position: 'relative', zIndex: 1, opacity: 0.6, maxWidth: '1200px', margin: '24px auto 0', padding: '0 20px' }}>
            <span>Swipe to explore</span>
            <Arrow />
          </div>
        </section>
      )}


      <Footer site={site} />
    </>
  );
}
