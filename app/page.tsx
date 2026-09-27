import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import QuoteCarousel from '@/components/QuoteCarousel';
import VideoGrid from '@/components/Videos';
import Countdown from '@/components/Countdown';
import { AdvanceForm, ContactForm } from '@/components/Forms';
import { Cover, Eyebrow, Seal } from '@/components/Bits';
import { Case, Cubby, SoonCubby } from '@/components/Shelf';
import { Arrow, Ext, Person } from '@/components/icons';
import ScrollReveal from '@/components/ScrollReveal';
import { getBooks, getSite, getVideos } from '@/lib/store';

export const revalidate = 60;

export default async function Home() {
  const [books, videos, site] = await Promise.all([getBooks(), getVideos(), getSite()]);
  const available = books.filter((b) => b.status === 'available');
  const coming = books.find((b) => b.status === 'coming');
  const featured = available.filter((b) => b.featured).slice(0, 5);
  const hero = featured.length ? featured : available.slice(0, 3);
  const shelf = available.slice(0, 7);
  const bio = site.bio.split(/\n\s*\n/).filter(Boolean);
  const roman = coming ? ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.'] : ['I.', '', 'II.', 'III.', 'IV.', 'V.'];

  return (
    <>
      <ScrollReveal />
      <div style={{ position: 'relative' }}>
        <Header />
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
          <p className="aside">Pick a book from the shelf to read a sample, then buy it on Amazon or Audible.</p>
        </div>
        <div className="reveal-on-scroll reveal-delay-1">
          <Case cols4>
            {shelf.map((b, k) => <Cubby key={b.id} book={b} no={k + 1} />)}
            <SoonCubby href={coming ? '/#coming' : '/books'} label={coming ? 'More to come' : 'See every book'} />
          </Case>
        </div>
        <div className="browse-row reveal-on-scroll reveal-delay-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="t1">Not seeing the book you want?</span>
            <span className="t2">The shelf above holds the latest {shelf.length}. The full library has every title Ken has written.</span>
          </div>
          <Link href="/books" className="btn btn-gold">BROWSE ALL BOOKS <Arrow /></Link>
        </div>
      </section>

      {/* II · COMING SOON */}
      {coming && (
        <section id="coming" className="coming">
          <div className="km-grain abs" style={{ opacity: 0.5 }} />
          <div className="ghost" aria-hidden>Soon</div>
          <div className="copy reveal-on-scroll">
            <Eyebrow num={roman[1]} text="COMING SOON" />
            <h2>{coming.title}</h2>
            {coming.tagline && <p className="teaser">{coming.tagline}</p>}
            <Countdown date={coming.releaseDate} label={coming.releaseLabel} />
            <div className="cta-row">
              <Link href="/#advance" className="btn btn-gold" style={{ boxShadow: 'none' }}>READ IT EARLY</Link>
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
      )}

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
            <VideoGrid videos={videos} />
          </div>
        </section>
      )}

      {/* IV · ADVANCE READERS */}
      <section id="advance" className="advance">
        <div className="km-paper abs" />
        <div className="copy reveal-on-scroll">
          <Eyebrow num={roman[3]} text="ADVANCE READERS" dark />
          <h2>Read the next one<br /><em>before anyone else.</em></h2>
          <p className="lead">Join Ken’s advance reader team. You receive an early copy of each new novel, and in return you leave an honest review when it launches.</p>
          <div className="steps">
            <div><b>i.</b><span>Sign up in under a minute</span></div>
            <div><b>ii.</b><span>Receive the book before release</span></div>
            <div><b>iii.</b><span>Share an honest review at launch</span></div>
          </div>
        </div>
        <div className="ar-wrap reveal-on-scroll reveal-delay-1">
          <div className="ar-seal seal km-seal"><div className="ring" style={{ width: '78%', height: '78%', fontSize: 26 }}>KM</div></div>
          <AdvanceForm bookTitle={coming?.title} />
        </div>
      </section>

      {/* V · ABOUT */}
      <section id="about" className="about">
        <div className="portrait reveal-on-scroll">
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
        <div className="copy reveal-on-scroll reveal-delay-1">
          <Eyebrow num={roman[4]} text="ABOUT KEN" />
          {site.pullQuote && <p className="pull">“{site.pullQuote}”</p>}
          <div className="bio">{bio.map((p, k) => <p key={k}>{p}</p>)}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="" className="sig" />
        </div>
      </section>

      {/* VI · CONTACT */}
      <section id="contact" className="contact">
        <div className="copy reveal-on-scroll">
          <Eyebrow num={roman[5]} text="CONTACT" />
          <h2 className="h2">Write <em>to Ken</em></h2>
          <p>Readers, book clubs, events and media. Your message goes straight to Ken’s inbox.</p>
        </div>
        <div className="reveal-on-scroll reveal-delay-1">
          <ContactForm />
        </div>
      </section>

      <Footer site={site} />
    </>
  );
}
