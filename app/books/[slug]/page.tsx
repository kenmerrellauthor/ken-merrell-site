import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Flipbook from '@/components/Flipbook';
import BookVideoPlayer from '@/components/BookVideoPlayer';
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
  const description = (book.tagline || book.description || '').replace(/\s+/g, ' ').slice(0, 160);
  const image = book.cover || book.banner || '/img/banners/ash.jpg';
  const title = `${book.title} · A Novel by Ken Merrell`;
  return {
    title: book.title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title,
      description,
      type: 'book',
      url: `/books/${book.slug}`,
      images: [{ url: image, alt: `${book.title} by Ken Merrell` }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} · Ken Merrell`,
      description,
      images: [image]
    }
  };
}

function getBannerTitle(b: { title: string; displayTitle?: string }): string {
  if (!b.displayTitle || b.displayTitle.trim().toLowerCase() === 'untitled') return b.title;
  const cleanDisplay = b.displayTitle.replace(/[*|_]/g, '').trim().toLowerCase();
  const cleanTitle = (b.title || '').trim().toLowerCase();
  if (cleanDisplay && cleanTitle && cleanDisplay !== cleanTitle) return b.title;
  return b.displayTitle;
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [book, all, site, videos] = await Promise.all([getBookBySlug(slug), getBooks(), getSite(), getVideos()]);
  if (!book) notFound();

  // Check if book has a video present (its own videoUrl or a matching title in videos)
  let bookVideoId = book.videoUrl ? parseYouTubeId(book.videoUrl) : '';
  const videoById = bookVideoId ? videos.find((v) => v.youtubeId === bookVideoId) : null;
  let bookVideoTitle = videoById?.title || (book.videoUrl ? `${book.title} — Video` : '');
  let bookVideoThumbnail = book.videoThumbnail || videoById?.thumbnail || (bookVideoId ? `https://i.ytimg.com/vi/${bookVideoId}/hqdefault.jpg` : null);

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
      bookVideoThumbnail = book.videoThumbnail || match.thumbnail || `https://i.ytimg.com/vi/${match.youtubeId}/hqdefault.jpg`;
    }
  }

  const others = all.filter((b) => b.id !== book.id && b.status === 'available').slice(0, 4);
  const idx = all.filter((b) => b.status === 'available').findIndex((b) => b.id === book.id);
  const quotes = (Array.isArray(book.quotes) ? book.quotes : []).filter((q) => q?.text?.trim());
  const hasSample = Boolean(typeof book.sample === 'string' && book.sample.trim());
  const facts = [
    ['PUBLISHED', book.status === 'coming' ? book.releaseLabel || 'Coming soon' : book.published],
    ['PAGES', book.pages],
    ['FORMATS', book.formats],
    ['ISBN', book.isbn]
  ].filter(([, v]) => v);
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const rawBase = envUrl || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');
  const baseOrigin = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`;
  const canonicalUrl = `${baseOrigin}/books/${book.slug}`;

  const approvedReviews = (book.reviews ?? []).filter((r) => r.approved);
  const avgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${canonicalUrl}#book`,
    name: book.title,
    headline: book.tagline || `${book.title} by Ken Merrell`,
    url: canonicalUrl,
    author: {
      '@type': 'Person',
      '@id': `${baseOrigin}/#author`,
      name: 'Ken Merrell',
      url: baseOrigin
    },
    publisher: {
      '@type': 'Person',
      name: 'Ken Merrell'
    },
    description: book.description || book.tagline,
    genre: book.genre,
    inLanguage: 'en',
    image: book.cover ? (book.cover.startsWith('http') ? book.cover : `${baseOrigin}${book.cover}`) : `${baseOrigin}/img/banners/ash.jpg`,
    isbn: /\d/.test(book.isbn) ? book.isbn : undefined,
    datePublished: book.published || book.releaseDate || undefined,
    bookFormat: [
      'https://schema.org/Hardcover',
      'https://schema.org/Paperback',
      'https://schema.org/EBook'
    ],
    offers: book.amazonUrl ? {
      '@type': 'Offer',
      url: book.amazonUrl,
      availability: book.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      priceCurrency: 'USD'
    } : undefined,
    aggregateRating: avgRating ? {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: approvedReviews.length,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    review: [
      ...approvedReviews.slice(0, 10).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : undefined,
        reviewBody: r.text,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1
        }
      })),
      ...quotes.map((q) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: q.source || 'Editorial Review' },
        reviewBody: q.text
      }))
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
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
            {hasSample ? (
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
              <h1><DisplayTitle text={getBannerTitle(book)} /></h1>
              {book.tagline && <p className="tag">{book.tagline}</p>}
              {book.description && <div className="desc">{book.description.split(/\n\s*\n/).map((p, k) => <p key={k}>{p}</p>)}</div>}
              <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 6, flexWrap: 'wrap', justifyContent: 'inherit' }}>
                {book.amazonUrl && <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">BUY ON AMAZON <Arrow /></a>}
                {book.audibleUrl && <a href={book.audibleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Headphones />LISTEN ON AUDIBLE</a>}
                {(bookVideoId || hasSample) && (
                  <a href={bookVideoId ? "#video" : "#sample"} className="btn btn-text">
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

      {/* 1. Cinematic Book Video / Trailer (if available) */}
      {bookVideoId && (
        <section id="video" className="book-video-section" aria-label="Book Video Trailer">
          <div className="book-video-ambient" />
          <div className="book-video-container">
            <div className="book-video-head">
              <div className="eyebrow"><span className="line" /><span className="txt">OFFICIAL TRAILER</span><span className="line" /></div>
              <h2>{bookVideoTitle || `${book.title} — Official Trailer`}</h2>
              <p className="book-video-sub">Watch the cinematic trailer and author reading before diving into the excerpt below.</p>
            </div>
            <BookVideoPlayer
              videoId={bookVideoId}
              title={bookVideoTitle || `${book.title} — Official Trailer`}
              thumbnail={bookVideoThumbnail}
            />
            {hasSample && (
              <a href="#sample" className="book-video-scroll-hint">
                <span>READ THE FIRST CHAPTER</span>
                <Down />
              </a>
            )}
          </div>
        </section>
      )}

      {/* 2. Interactive Sample Chapter Flipbook */}
      {hasSample && (
        <section id="sample" className="sample">
          <div className="km-paper abs" style={{ opacity: 0.28, pointerEvents: 'none', mixBlendMode: 'multiply' }} />
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
    </>
  );
}
