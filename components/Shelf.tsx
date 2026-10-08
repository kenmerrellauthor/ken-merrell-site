import Link from 'next/link';
import type { Book } from '@/lib/types';
import { Cover } from './Bits';

export function Cubby({ book, no, small, isNew }: { book: Book; no: number; small?: boolean; isNew?: boolean }) {
  const showRibbon = isNew !== undefined ? isNew : Boolean(book.isNew);
  return (
    <Link href={`/books/${book.slug}`} className={`cubby km-cubby${small ? ' sm' : ''}`} aria-label={book.title}>
      <div className="km-lamp abs" />
      <div className="lamp-fix" />
      <div className="cubby-head">
        <span className="cubby-no">NO. {String(no).padStart(2, '0')}</span>
        <span className="cubby-title">{book.title}</span>
      </div>
      <div className="shadow" />
      <div className="bk">
        <Cover book={book} w={small ? 140 : 176} h={small ? 210 : 264} title={small ? 19 : 23} author={small ? 9 : 11} />
        <div className="km-spine abs" />
        {showRibbon && <span className="ribbon">NEW</span>}
      </div>
      <div className="lip km-wood km-lip">
        <div className="plate km-brass">
          <span className="plate-btn">BOOK DETAILS →</span>
        </div>
      </div>
    </Link>
  );
}

export function EmptyCubby({ small, text = 'Room for the next one' }: { small?: boolean; text?: string }) {
  return (
    <div className={`cubby empty km-cubby${small ? ' sm' : ''}`} aria-hidden>
      <div className="km-lamp abs" style={{ opacity: 0.5 }} />
      <div className="lamp-fix" style={{ opacity: 0.6 }} />
      <div className="note">{text}</div>
      <div className="lip km-wood km-lip" />
    </div>
  );
}

export function SoonCubby({ href = '/books', label = 'Browse All Books' }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="cubby km-cubby" aria-label="Browse all books in the bookshelf collection">
      <div className="km-lamp abs" />
      <div className="lamp-fix" />
      <div className="cubby-head">
        <span className="cubby-no">THE BOOKSHELF</span>
        <span className="cubby-title">{label}</span>
      </div>
      <div className="shadow" />
      <div className="soon-stack">
        <div style={{ position: 'relative', width: 150, height: 190, background: '#120f0c', boxShadow: '10px 4px 18px rgba(0,0,0,.7)' }}>
          <div className="km-linen abs" />
          <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(201,168,96,.6)' }} />
          <div className="abs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div className="seal km-seal" style={{ width: 60, height: 60, boxShadow: '0 6px 12px rgba(0,0,0,.5)' }}>
              <div className="ring" style={{ width: 48, height: 48, fontSize: 15 }}>KM</div>
            </div>
            <span style={{ fontFamily: 'var(--serif-c)', fontSize: 8, letterSpacing: '.3em', color: '#a89d88' }}>ALL BOOKS</span>
          </div>
        </div>
        <div style={{ position: 'relative', width: 196, height: 26, background: '#4b1d1b', boxShadow: '8px 3px 10px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="km-linen abs" />
          <span style={{ position: 'relative', fontFamily: 'var(--serif-c)', fontSize: 9, fontWeight: 700, letterSpacing: '.24em', color: '#d4b56e' }}>KEN MERRELL</span>
        </div>
        <div style={{ position: 'relative', width: 204, height: 30, background: '#1f2d25', boxShadow: '8px 3px 10px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="km-linen abs" />
          <span style={{ position: 'relative', fontFamily: 'var(--serif-c)', fontSize: 9, fontWeight: 700, letterSpacing: '.24em', color: '#d4b56e' }}>KEN MERRELL</span>
        </div>
      </div>
      <div className="lip km-wood km-lip">
        <div className="plate km-brass">
          <span className="plate-btn">VIEW ALL BOOKS →</span>
        </div>
      </div>
    </Link>
  );
}

/** Wooden bookcase frame: top board, body, base and feet. */
export function Case({ children, cols4, stacked }: { children: React.ReactNode; cols4?: boolean; stacked?: boolean }) {
  return (
    <div className={`case${cols4 ? ' c4' : ''}${stacked ? ' stacked' : ''}`}>
      <div className="glowbox km-shelf-glow" />
      <div className="top km-wood" />
      <div className="body km-wood">{children}</div>
      <div className="base km-wood" />
      <div className="feet"><span className="km-wood" /><span className="km-wood" /></div>
    </div>
  );
}
