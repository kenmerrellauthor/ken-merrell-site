'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Book } from '@/lib/types';
import { Book3D, DisplayTitle } from './Bits';
import { Arrow, BookIc, ChevL, ChevR, Headphones } from './icons';

function getHeroTitle(book: Book): string {
  if (!book.displayTitle || book.displayTitle.trim().toLowerCase() === 'untitled') {
    return book.title;
  }
  const cleanDisplay = book.displayTitle.replace(/[*|_]/g, '').trim().toLowerCase();
  const cleanTitle = (book.title || '').trim().toLowerCase();
  if (cleanDisplay && cleanTitle && cleanDisplay !== cleanTitle) {
    return book.title;
  }
  return book.displayTitle;
}

export default function HeroCarousel({ books }: { books: Book[] }) {
  const n = books.length;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);
  const sx = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerInteraction = useCallback(() => {
    setIsPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 7000);
  }, []);

  const move = useCallback((step: number, fromAuto = false) => {
    setI((cur) => {
      if (fromAuto) {
        setDir('next');
        return (cur + 1) % n;
      }
      const next = cur + step;
      if (next < 0 || next >= n) return cur;
      setDir(step > 0 ? 'next' : 'prev');
      return next;
    });
    if (!fromAuto) {
      triggerInteraction();
    }
  }, [n, triggerInteraction]);

  useEffect(() => {
    if (isPaused || n < 2) return;
    const t = setInterval(() => move(1, true), 6000);
    return () => clearInterval(t);
  }, [isPaused, move, n, i]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  if (!n) return null;

  const go = (k: number) => {
    if (k === i || k < 0 || k >= n) return;
    setDir(k > i ? 'next' : 'prev');
    setI(k);
    triggerInteraction();
  };


  return (
    <section
      className={`hero dir-${dir}`}
      aria-roledescription="carousel"
      aria-label="Featured books"
      onPointerDown={(e) => { sx.current = e.clientX; }}
      onPointerUp={(e) => {
        if (sx.current == null) return;
        const dx = e.clientX - sx.current;
        sx.current = null;
        if (dx < -50 && i < n - 1) move(1);
        else if (dx > 50 && i > 0) move(-1);
      }}
    >
      {books.map((b, k) => (
        <div key={b.id} className={`slide${k === i ? ' on' : ''}`} aria-hidden={k !== i} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}>
          <div className="slide-bg" style={{ backgroundImage: b.banner ? `url(${b.banner})` : undefined, backgroundColor: '#15120f' }} />
          <div className="km-hero-scrim abs" />
          <div className="km-hero-top" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220 }} />
          <div className="km-hero-fade" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 240 }} />
          <div className="inner">
            <div className="copy">
              <div className="kicker"><span className="l" /><span className="t">{b.isNew ? 'THE NEW NOVEL' : 'NOW AVAILABLE'}</span></div>
              {k === 0 ? (
                <h1 className="title"><DisplayTitle text={getHeroTitle(b)} /></h1>
              ) : (
                <h2 className="title"><DisplayTitle text={getHeroTitle(b)} /></h2>
              )}
              {b.tagline && <p className="tag">{b.tagline}</p>}
              {b.description && <p className="desc">{b.description.split('\n\n')[0]}</p>}
              <div className="actions">
                {b.amazonUrl && (
                  <a href={b.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold" tabIndex={k === i ? 0 : -1}>BUY ON AMAZON <Arrow /></a>
                )}
                <Link href={`/books/${b.slug}#sample`} className="btn btn-ghost" tabIndex={k === i ? 0 : -1}><BookIc />READ A SAMPLE</Link>
                {b.audibleUrl && (
                  <a href={b.audibleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-text" tabIndex={k === i ? 0 : -1}><Headphones />AUDIBLE</a>
                )}
              </div>
            </div>
            <div className="bookwrap">
              <Link href={`/books/${b.slug}`} aria-label={`Open ${b.title}`} tabIndex={-1} style={{ display: 'block' }}>
                <Book3D book={b} i={k} />
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className="km-grain abs" style={{ opacity: 0.6, pointerEvents: 'none' }} />
      {n > 1 && (
        <div className="hero-tabs">
          <div className="tabs">
            {books.map((b, k) => (
              <button key={b.id} type="button" className={`hero-tab${k === i ? ' on' : ''}${!isPaused ? ' auto' : ''}`} onClick={() => go(k)} aria-label={`Show ${b.title}`} aria-current={k === i}>
                <span className="track"><span className="fill" key={`${i}-${!isPaused}`} /></span>
                <span className="n">{String(k + 1).padStart(2, '0')}{b.isNew ? ' · NEW' : ''}</span>
                <span className="nm">{b.title}</span>
              </button>
            ))}
          </div>
          <div className="ctrl">
            <span className="count">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`sq-btn${i > 0 ? ' gold' : ' disabled'}`}
                onClick={() => move(-1)}
                disabled={i === 0}
                aria-label="Previous book"
              >
                <ChevL />
              </button>
              <button
                type="button"
                className={`sq-btn${i < n - 1 ? ' gold' : ' disabled'}`}
                onClick={() => move(1)}
                disabled={i === n - 1}
                aria-label="Next book"
              >
                <ChevR />
              </button>
            </div>
          </div>
        </div>

      )}
    </section>
  );
}
