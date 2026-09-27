import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Flipbook from '@/components/Flipbook';
import { Book3D, DisplayTitle } from '@/components/Bits';
import { Case, Cubby } from '@/components/Shelf';
import { Arrow, Down, Headphones } from '@/components/icons';
import { getBookBySlug, getBooks, getSite } from '@/lib/store';

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
  const [book, all, site] = await Promise.all([getBookBySlug(slug), getBooks(), getSite()]);
  if (!book) notFound();
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
            <Book3D book={book} w={410} h={615} i={Math.max(0, idx)} />
            <div className="info">
              <div className="eyebrow"><span className="line" style={{ width: 48 }} /><span className="txt">{book.status === 'coming' ? 'COMING SOON' : (book.genre || 'A NOVEL').toUpperCase()}</span></div>
              <h1><DisplayTitle text={book.displayTitle || book.title} /></h1>
              {book.tagline && <p className="tag">{book.tagline}</p>}
              {book.description && <div className="desc">{book.description.split(/\n\s*\n/).map((p, k) => <p key={k}>{p}</p>)}</div>}
              <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 6, flexWrap: 'wrap', justifyContent: 'inherit' }}>
                {book.amazonUrl && <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">BUY ON AMAZON <Arrow /></a>}
                {book.audibleUrl && <a href={book.audibleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Headphones />LISTEN ON AUDIBLE</a>}
                {book.sample.trim() && <a href="#sample" className="btn btn-text">READ THE SAMPLE <Down /></a>}
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

      {book.sample.trim() && (
        <section id="sample" className="sample">
          <div className="km-paper abs" />
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
