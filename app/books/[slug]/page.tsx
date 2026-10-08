import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Flipbook from '@/components/Flipbook';
import BookVideoCoverflow from '@/components/BookVideoCoverflow';
import { Book3D, DisplayTitle } from '@/components/Bits';
import { Case, Cubby } from '@/components/Shelf';
import { Arrow, Down, Headphones } from '@/components/icons';
import { getBookBySlug, getBooks, getSite, getVideos } from '@/lib/store';
import { parseYouTubeId } from '@/lib/youtube';
import type { BookVideo } from '@/lib/types';
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

  // Resolve all videos for this book (supporting multiple trailers, readings, interviews)
  let bookVideos: BookVideo[] = [];
  if (Array.isArray(book.videos) && book.videos.length > 0) {
    bookVideos = book.videos.filter((v) => Boolean(v && v.url && v.url.trim()));
  } else if (book.videoUrl && book.videoUrl.trim()) {
    const yId = parseYouTubeId(book.videoUrl);
    const videoById = yId ? videos.find((v) => v.youtubeId === yId) : null;
    bookVideos = [{
      id: 'bv-1',
      url: book.videoUrl,
      title: videoById?.title || `${book.title} — Official Trailer`,
      type: 'Trailer',
      thumbnail: book.videoThumbnail || videoById?.thumbnail || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null),
    }];
  }

  // Fallback to gallery videos matching book title if none explicitly attached
  if (bookVideos.length === 0) {
    const matches = videos.filter((v) => {
      if (!v.youtubeId) return false;
      const vt = v.title.toLowerCase();
      const bt = book.title.toLowerCase();
      return vt.includes(bt) || bt.includes(vt);
    });
    if (matches.length > 0) {
      bookVideos = matches.map((m, i) => ({
        id: m.id || `bv-${i + 1}`,
        url: `https://www.youtube.com/watch?v=${m.youtubeId}`,
        title: m.title,
        type: m.type || (i === 0 ? 'Trailer' : 'Reading'),
        thumbnail: m.thumbnail || `https://i.ytimg.com/vi/${m.youtubeId}/hqdefault.jpg`,
      }));
    }
  }

  const hasVideos = bookVideos.length > 0;

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
  const envUrl = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kenmerrell.com')?.trim();
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
                {(hasVideos || hasSample) && (
                  <a href={hasVideos ? "#video" : "#sample"} className="btn btn-text">
                    {hasVideos ? (bookVideos.length > 1 ? 'WATCH VIDEOS' : 'WATCH TRAILER') : 'READ THE SAMPLE'} <Down />
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

      {/* 1. Cinematic Book Video Section / Coverflow (single or multiple videos) */}
      {hasVideos && (
        <BookVideoCoverflow
          videos={bookVideos}
          bookTitle={book.title}
          hasSample={hasSample}
        />
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
