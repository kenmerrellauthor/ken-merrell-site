import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Flipbook from '@/components/Flipbook';
import { Book3D, DisplayTitle } from '@/components/Bits';
import { Case, Cubby } from '@/components/Shelf';
import { Arrow, Down, Headphones } from '@/components/icons';
import { getBookBySlug, getBooks, getSite, getVideos } from '@/lib/store';
import { parseYouTubeId } from '@/lib/youtube';
import ReviewSection from '@/components/ReviewSection';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getBooks()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const book = await getBookBySlug((await params).slug);
  if (!book) return {};
  const description = (book.tagline || book.description).replace(/\s+/g, ' ').slice(0, 160);
  return {
    title: book.title,
    description,
    openGraph: { title: `${book.title} by Ken Merrell`, description, images: book.cover ? [book.cover] : undefined, type: 'book' }
  };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [book, all, site, videos] = await Promise.all([getBookBySlug(slug), getBooks(), getSite(), getVideos()]);
  if (!book) notFound();

  // Check if book has a video present (its own videoUrl or a matching title in videos)
  let bookVideoId = book.videoUrl ? parseYouTubeId(book.videoUrl) : '';
  let bookVideoTitle = book.videoUrl ? `${book.title} — Video` : '';

  if (!bookVideoId) {
    const match = videos.find((v) => {
      if (!v.youtubeId) return false;
      const vt = v.title.toLowerCase();
      const bt = book.title.toLowerCase();
      return vt.includes(bt) || bt.includes(vt);
    });
    if (match) {
      bookVideoId = match.youtubeId;
      bookVideoTitle = match.title;
    }
  }

  const others = all.filter((b) => b.id !== book.id && b.status === 'available').slice(0, 4);
  const idx = all.filter((b) => b.status === 'available').findIndex((b) => b.id === book.id);
  const quotes = book.quotes.filter((q) => q.text.trim());
  const facts = [
    ['PUBLISHED', book.status === 'coming' ? book.releaseLabel || 'Coming soon' : book.published],
    ['PAGES', book.pages],
    ['FORMATS', book.formats],
    ['ISBN', book.isbn]
  ].filter(([, v]) => v);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: 'Ken Merrell' },
    image: book.cover || undefined,
    description: book.description,
    isbn: /\d/.test(book.isbn) ? book.isbn : undefined
  };

  return (
    <>
      <section className="book-hero" style={{ backgroundImage: book.banner ? `url(${book.banner})` : undefined, backgroundColor: '#15120f' }}>
        <div className="book-scrim abs" />
        <div className="km-hero-top" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220 }} />
        <div className="km-hero-fade" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 }} />
        <div className="km-grain abs" style={{ opacity: 0.6 }} />
        <Header active="books" />
        <div className="content">
          <nav aria-label="Breadcrumb" className="crumbs">
            <Link href="/">HOME</Link><span>/</span><Link href="/books">BOOKS</Link><span>/</span><span className="cur" aria-current="page">{book.title}</span>
          </nav>
          <div className="book-main">
            {book.sample.trim() ? (
              <a href="#sample" className="book-cover-link" aria-label="Click here to open the book" style={{ position: 'relative', display: 'block' }}>
                <Book3D book={book} w={410} h={615} i={Math.max(0, idx)} />
                <div className="book-hover-hint" style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                  <span style={{ background: '#c9a860', color: '#111', padding: '10px 16px', borderRadius: 4, fontWeight: 600, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    Click here to open the book
                  </span>
                </div>
              </a>
            ) : (
              <Book3D book={book} w={410} h={615} i={Math.max(0, idx)} />
            )}
            <div className="info">
              <div className="eyebrow"><span className="line" style={{ width: 48 }} /><span className="txt">{book.status === 'coming' ? 'COMING SOON' : (book.genre || 'A NOVEL').toUpperCase()}</span></div>
              <h1><DisplayTitle text={book.displayTitle || book.title} /></h1>
              {book.tagline && <p className="tag">{book.tagline}</p>}
              {book.description && <div className="desc">{book.description.split(/\n\s*\n/).map((p, k) => <p key={k}>{p}</p>)}</div>}
              <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 6, flexWrap: 'wrap', justifyContent: 'inherit' }}>
                {book.amazonUrl && <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">BUY ON AMAZON <Arrow /></a>}
                {book.audibleUrl && <a href={book.audibleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Headphones />LISTEN ON AUDIBLE</a>}
                {(bookVideoId || book.sample.trim()) && (
                  <a href="#sample" className="btn btn-text">
                    {bookVideoId ? 'WATCH & READ' : 'READ THE SAMPLE'} <Down />
                  </a>
                )}
              </div>
              {facts.length > 0 && (
                <div className="facts" style={{ ['--cols' as string]: Math.min(4, facts.length) } as React.CSSProperties}>
                  {facts.map(([k, v]) => <div key={k}><span className="k">{k}</span><span className="v">{v}</span></div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {quotes.length > 0 && (
        <section className="praise" aria-label="Praise">
          {quotes.slice(0, 3).map((q, k) => (
            <figure key={k}>
              <span className="mk" aria-hidden>“</span>
              <blockquote>{q.text}</blockquote>
              {q.source && <figcaption>{q.source}</figcaption>}
            </figure>
          ))}
        </section>
      )}

      {(bookVideoId || book.sample.trim()) && (
        <section id="sample" className="sample">
          <div className="km-paper abs" />

          {/* 1. First: Video present if any */}
          {bookVideoId && (
            <div className="book-video-wrap" style={{ width: '100%', maxWidth: 860, margin: '0 auto 60px', padding: '0 16px', boxSizing: 'border-box' }}>
              <div className="head" style={{ marginBottom: 24, textAlign: 'center' }}>
                <div className="eyebrow dark"><span className="line" /><span className="txt">WATCH</span><span className="line" /></div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '8px 0 10px', color: '#1b1814' }}>
                  {bookVideoTitle || `${book.title} — Official Trailer`}
                </h2>
                <p className="hint">Watch the trailer or reading before opening the manuscript below.</p>
              </div>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
                border: '1px solid rgba(201,168,96,0.35)',
                background: '#0a0908'
              }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${bookVideoId}?rel=0`}
                  title={bookVideoTitle || `${book.title} Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            </div>
          )}

          {/* 2. Then: Reading the book (mean swipe the book to read it) */}
          {book.sample.trim() && (
            <>
              <div className="head">
                <div className="eyebrow dark"><span className="line" /><span className="txt">READ A SAMPLE</span><span className="line" /></div>
                <h2>Open the <em>first chapter</em></h2>
                <p className="hint">Swipe the page or use the arrows to turn it.</p>
              </div>
              <Flipbook
                title={book.title}
                cover={book.cover}
                clothColor={book.clothColor}
                tagline={book.tagline}
                chapterTitle={book.chapterTitle}
                sample={book.sample}
                amazonUrl={book.amazonUrl}
                audibleUrl={book.audibleUrl}
              />
            </>
          )}
        </section>
      )}

      {/* Reader Reviews */}
      <ReviewSection bookId={book.id} reviews={book.reviews ?? []} />

      {others.length > 0 && (
        <section className="more">
          <div className="sec-head">
            <div className="l">
              <div className="eyebrow"><span className="line" /><span className="txt">MORE BY KEN MERRELL</span></div>
              <h2 className="h2" style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>You may <em>also like</em></h2>
            </div>
            <Link href="/books" className="link-underline">ALL BOOKS <Arrow /></Link>
          </div>
          <Case cols4>
            {others.map((b) => <Cubby key={b.id} book={b} no={all.filter((x) => x.status === 'available').findIndex((x) => x.id === b.id) + 1} />)}
          </Case>
        </section>
      )}

      <Footer site={site} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
