import Link from 'next/link';
import type { Metadata } from 'next';
import PlainHeader from '@/components/PlainHeader';
import { Case, Cubby, EmptyCubby } from '@/components/Shelf';
import { Arrow, ArrowLeft } from '@/components/icons';
import { getBooks } from '@/lib/store';

export const revalidate = 60;
export const metadata: Metadata = { title: 'All books', description: 'Every novel by Ken Merrell, shelf by shelf.' };

const PER_SHELF = 6;
const SHELVES = 6;
const PER_PAGE = PER_SHELF * SHELVES;

export default async function Library({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const books = (await getBooks()).filter((b) => b.status === 'available');
  const pages = Math.max(1, Math.ceil(books.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number((await searchParams).page) || 1));
  const start = (page - 1) * PER_PAGE;
  const onPage = books.slice(start, start + PER_PAGE);
  const shelves: (typeof books[number] | null)[][] = [];
  for (let s = 0; s < Math.max(1, Math.ceil(onPage.length / PER_SHELF)); s++) {
    const row = onPage.slice(s * PER_SHELF, s * PER_SHELF + PER_SHELF) as (typeof books[number] | null)[];
    while (row.length < PER_SHELF) row.push(null);
    shelves.push(row);
  }
  const href = (p: number) => (p === 1 ? '/books' : `/books?page=${p}`);

  return (
    <>
      <PlainHeader active="books" />
      <main>
        <section className="lib-intro">
          <div className="l">
            <Link href="/" className="back"><ArrowLeft s={14} />BACK TO HOME</Link>
            <div className="eyebrow"><span className="line" /><span className="txt">THE LIBRARY</span></div>
            <h1 className="h1">Every book, <em>shelf by shelf</em></h1>
          </div>
          <div className="lib-count">
            <b>{books.length}</b>
            <span>BOOKS IN THE COLLECTION</span>
          </div>
        </section>
        <section className="lib-body">
          <Case stacked>
            {shelves.map((row, s) => (
              <div key={s} className="shelf-row">
                {row.map((b, c) => (b ? <Cubby key={b.id} book={b} no={start + s * PER_SHELF + c + 1} small /> : <EmptyCubby key={`e${c}`} small />))}
              </div>
            ))}
          </Case>
          <nav aria-label="Bookshelf pages" className="pager">
            <Link href={href(page - 1)} className={`prev${page <= 1 ? ' off' : ''}`} aria-disabled={page <= 1}><ArrowLeft />PREVIOUS SHELF</Link>
            <div className="mid">
              {pages > 1 && (
                <div className="nums">
                  {Array.from({ length: pages }, (_, k) => k + 1).map((p) =>
                    p === page ? <span key={p} className="on" aria-current="page">{p}</span> : <Link key={p} href={href(p)} aria-label={`Shelf page ${p}`}>{p}</Link>
                  )}
                </div>
              )}
              <span className="range">BOOKS {books.length ? start + 1 : 0}–{start + onPage.length} OF {books.length}</span>
            </div>
            <Link href={href(page + 1)} className={`next${page >= pages ? ' off' : ''}`} aria-disabled={page >= pages}>NEXT SHELF <Arrow /></Link>
          </nav>
        </section>
      </main>
      <footer className="lib-footer">
        <div className="km-grain abs" style={{ opacity: 0.5 }} />
        <div className="rule2" style={{ position: 'absolute', left: 0, right: 0, top: 0 }} />
        <span>© {new Date().getFullYear()} Ken Merrell. All rights reserved.</span>
        <Link href="/">BACK TO HOME</Link>
      </footer>
    </>
  );
}
