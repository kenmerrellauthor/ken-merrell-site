'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Block } from '@/lib/sample';
import { paginate, parseSample } from '@/lib/sample';
import { ChevL, ChevR, Arrow, Headphones } from './icons';

type Page =
  | { kind: 'cover' | 'endpaper' | 'none'; side: 'left' | 'right' }
  | { kind: 'opener'; side: 'left' | 'right'; num: number }
  | { kind: 'text'; side: 'left' | 'right'; num: number; blocks: Block[]; firstPage: boolean; isLastTextPage?: boolean }
  | { kind: 'end'; side: 'left' | 'right' };

export type FlipBookProps = {
  title: string;
  cover: string | null;
  clothColor: string;
  tagline: string;
  chapterTitle: string;
  sample: string;
  amazonUrl: string;
  audibleUrl: string;
};

function Blocks({ blocks, firstPage, mobile }: { blocks: Block[]; firstPage: boolean; mobile?: boolean }) {
  return (
    <>
      {blocks.map((b, k) => {
        if (b.kind === 'break') {
          return (
            <div key={k} className="brk" aria-hidden style={mobile ? { display: 'flex', justifyContent: 'center', gap: 14, padding: '12px 0' } : undefined}>
              <span /><span /><span />
            </div>
          );
        }
        if (firstPage && k === 0 && !b.cont) {
          const text = b.text || '';
          const m = text.match(/^([“"‘']?[A-Za-z0-9])(\S*)\s*([^\s]+(?:\s+[^\s]+){0,2})?(.*)$/s);
          const drop = m ? m[1] : (text[0] || '');
          const secondWord = m && m[2] ? m[2] : '';
          const nextWords = m && m[3] ? m[3] : '';
          const lead = (secondWord ? secondWord + (nextWords ? ' ' + nextWords : '') : nextWords).trim();
          const rest = m && m[4] ? m[4] : text.slice(drop.length);
          return (
            <p key={k} className="first">
              {drop && <span className="drop">{drop}</span>}
              {lead && <span className="lead-words">{lead}</span>}{' '}
              {rest.trim()}
            </p>
          );
        }
        return <p key={k} className={b.cont ? 'cont' : b.noIndent ? 'first' : undefined}>{b.text}</p>;
      })}
    </>
  );
}

function SamplePage({ p, book }: { p: Page; book: FlipBookProps }) {
  const paper = p.kind === 'opener' || p.kind === 'text' || p.kind === 'end' || p.kind === 'none';
  const gut = p.side === 'left' ? 'gut-l' : 'gut-r';
  return (
    <div className={`sp${paper ? ' paper' : ''}${p.kind === 'endpaper' ? ' endpaper' : ''}`}>
      {p.kind === 'cover' && (
        <>
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cover-img" src={book.cover} alt={`${book.title} cover`} />
          ) : (
            <div className="abs" style={{ background: book.clothColor }}>
              <div className="km-linen abs" />
              <div className="abs" style={{ inset: 30, border: '1px solid rgba(214,181,110,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '60px 40px' }}>
                <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: '#d4b56e' }} />
                <span style={{ fontFamily: 'var(--serif-d)', fontSize: 48, fontWeight: 700, color: '#d4b56e', letterSpacing: '.06em', textTransform: 'uppercase', lineHeight: 1.1 }}>{book.title}</span>
                <span style={{ fontFamily: 'var(--serif-c)', fontSize: 13, fontWeight: 700, letterSpacing: '.24em', color: '#d4b56e' }}>KEN MERRELL</span>
              </div>
            </div>
          )}
          <div className="abs" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(255,255,255,.22) 1.4%, rgba(0,0,0,.28) 3.4%, rgba(0,0,0,0) 8%, rgba(0,0,0,0) 92%, rgba(0,0,0,.18) 100%)' }} />
        </>
      )}
      {p.kind === 'endpaper' && (
        <>
          <div className="abs" style={{ inset: 24, border: '1px solid rgba(201,168,96,.35)' }} />
          <div className="center" style={{ gap: 22, padding: 60 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 46, width: 'auto' }} />
            <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: '#c9a860' }} />
            <span style={{ fontFamily: 'var(--serif-c)', fontSize: 11, letterSpacing: '.34em', color: '#a89d88' }}>A SAMPLE FROM</span>
            <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 34, lineHeight: 1.15, color: '#e6dcc7' }}>{book.title}</span>
          </div>
          <div className="abs" style={{ background: 'linear-gradient(270deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 10%)' }} />
        </>
      )}
      {(p.kind === 'text' || p.kind === 'opener') && (
        <>
          <div className="run">{p.side === 'left' ? 'KEN MERRELL' : book.title}</div>
          <div className="num">{p.num}</div>
        </>
      )}
      {p.kind === 'opener' && (
        <div className="center">
          <span style={{ fontFamily: 'var(--serif-c)', fontSize: 11, fontWeight: 700, letterSpacing: '.34em', color: '#7a5c1e' }}>READ A SAMPLE</span>
          <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 24, color: '#7a5c1e', paddingTop: 20 }}>Chapter</span>
          <span style={{ fontFamily: 'var(--serif-d)', fontWeight: 600, fontSize: 120, lineHeight: 0.8, color: '#1b1814' }}>One</span>
          {book.chapterTitle && <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 26, color: '#5d5448', paddingTop: 10 }}>{book.chapterTitle}</span>}
          <div className="sp-orn" aria-hidden><span className="l" /><span className="o" /><span className="f" /><span className="o" /><span className="l" /></div>
          {book.tagline && <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 21, lineHeight: 1.4, color: '#6b6152', paddingTop: 40, whiteSpace: 'pre-line' }}>{book.tagline}</span>}
        </div>
      )}
      {p.kind === 'text' && (
        <div className="text">
          <Blocks blocks={p.blocks} firstPage={p.firstPage} />
          {p.isLastTextPage && (
            <div className="sp-tail" aria-hidden>
              <span className="l" />
              <span className="f" />
              <span className="l" />
            </div>
          )}
        </div>
      )}
      {p.kind === 'end' && (
        <div className="center" style={{ gap: 20 }}>
          <div className="sp-orn" aria-hidden style={{ paddingTop: 0 }}><span className="l" style={{ width: 48 }} /><span className="f" /><span className="l" style={{ width: 48 }} /></div>
          <span style={{ fontFamily: 'var(--serif-c)', fontSize: 11, fontWeight: 700, letterSpacing: '.34em', color: '#7a5c1e' }}>END OF SAMPLE</span>
          <span style={{ fontFamily: 'var(--serif-d)', fontWeight: 600, fontSize: 64, lineHeight: 1, color: '#1b1814' }}>Keep <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#7a5c1e' }}>reading.</span></span>
          <span style={{ fontSize: 17, lineHeight: 1.6, color: '#5d5448', maxWidth: 340 }}>The full novel is available {book.audibleUrl ? 'in print, ebook and audio' : 'in print and ebook'}.</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300, paddingTop: 14 }}>
            {book.amazonUrl && <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()} style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1b1814', color: '#e2c683', fontFamily: 'var(--serif-c)', fontSize: 12, fontWeight: 700, letterSpacing: '.18em' }}>BUY ON AMAZON</a>}
            {book.audibleUrl && <a href={book.audibleUrl} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()} style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #b9a982', color: '#2c2721', fontFamily: 'var(--serif-c)', fontSize: 12, fontWeight: 700, letterSpacing: '.18em' }}>LISTEN ON AUDIBLE</a>}
          </div>
        </div>
      )}
      {paper && <div className={gut} />}
    </div>
  );
}

function useSwipe(onNext: () => void, onPrev: () => void) {
  const sx = useRef<number | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => { sx.current = e.clientX; },
    onPointerUp: (e: React.PointerEvent) => {
      if (sx.current == null) return;
      const dx = e.clientX - sx.current;
      sx.current = null;
      if (dx < -40) onNext();
      else if (dx > 40) onPrev();
    }
  };
}

/* ---------- desktop / tablet: the open two-page book ---------- */
function DesktopBook({ book }: { book: FlipBookProps }) {
  const pages = useMemo<Page[]>(() => {
    const text = paginate(parseSample(book.sample || ''), 620, 540);
    const list: Page[] = [{ kind: 'cover', side: 'right' }, { kind: 'endpaper', side: 'left' }, { kind: 'opener', side: 'right', num: 1 }];
    text.forEach((blocks, k) =>
      list.push({
        kind: 'text',
        side: list.length % 2 ? 'left' : 'right',
        num: k + 2,
        blocks,
        firstPage: k === 0,
        isLastTextPage: k === text.length - 1
      })
    );
    list.push({ kind: 'end', side: list.length % 2 ? 'left' : 'right' });
    return list;
  }, [book.sample]);
  const maxS = Math.floor(pages.length / 2);
  const [s, setS] = useState(0);
  const [flip, setFlip] = useState<null | 'next' | 'prev'>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const pg = (i: number): Page => (i >= 0 && i < pages.length ? pages[i] : { kind: 'none', side: i % 2 ? 'left' : 'right' });
  const turn = (d: 'next' | 'prev') => {
    if (flip) return;
    if (d === 'next' && s >= maxS) return;
    if (d === 'prev' && s <= 0) return;
    setFlip(d);
    timer.current = setTimeout(() => { setFlip(null); setS((c) => (d === 'next' ? c + 1 : c - 1)); }, 900);
  };
  const swipe = useSwipe(() => turn('next'), () => turn('prev'));

  // scale the 1120px book down to fit narrower screens
  const fit = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = fit.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 40) / 1152)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let left = pg(2 * s - 1), right = pg(2 * s);
  let front: Page | null = null, back: Page | null = null, leafLeft = 560;
  if (flip === 'next') { right = pg(2 * s + 2); front = pg(2 * s); back = pg(2 * s + 1); leafLeft = 560; }
  if (flip === 'prev') { left = pg(2 * s - 3); front = pg(2 * s - 1); back = pg(2 * s - 2); leafLeft = 0; }
  const label = s === 0 ? 'COVER' : s === 1 ? 'CHAPTER ONE' : s === maxS ? 'END OF SAMPLE' : `PAGES ${2 * s - 2} · ${2 * s - 1}`;
  const showBoard = s > 0 || flip === 'prev';
  const idle = s === 0 && !flip;

  return (
    <div className="d-reader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56, width: '100%' }}>
      <div ref={fit} className="fb-fit" style={{ height: 760 * scale }}>
        <div className="fb-stage" style={{ transform: `scale(${scale})` }} {...swipe} aria-label={`Sample chapter of ${book.title}. ${label}`} role="region">
          <div className="fb-shadow" />
          {showBoard && (<><div className="fb-board"><div className="km-linen abs" style={{ borderRadius: 4 }} /></div><div className="fb-board2" /></>)}
          {idle && <div style={{ position: 'absolute', left: 560, top: 0, width: 560, height: 760, boxShadow: '0 40px 80px rgba(40,25,10,.4)' }} />}
          {left.kind !== 'none' || showBoard ? <div className="fb-page" style={{ left: 0, visibility: s === 0 && flip !== 'prev' ? 'hidden' : 'visible' }}><SamplePage p={left} book={book} /></div> : null}
          <div className="fb-page" style={{ left: 548 }}><SamplePage p={right} book={book} /></div>
          {showBoard && <div className="fb-gutter" />}
          {idle && (
            <>
              <div className="fb-idle" onClick={() => turn('next')} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && turn('next')}>
                <span className="a">Click here to open the book</span>
                <span className="b">SWIPE OR CLICK TO TURN PAGES <Arrow /></span>
              </div>
              <button type="button" className="fb-hit" style={{ left: 560 }} aria-label="Open the book" onClick={() => turn('next')} />
            </>
          )}
          {flip && front && back && (
            <div className={`fb-leaf ${flip}`} style={{ left: leafLeft }}>
              <div className="fb-face"><SamplePage p={front} book={book} /><div className="fb-shade" style={{ background: 'linear-gradient(90deg, rgba(40,25,10,.28) 0%, rgba(40,25,10,.06) 60%, rgba(40,25,10,0) 100%)' }} /></div>
              <div className="fb-face fb-back"><SamplePage p={back} book={book} /><div className="fb-shade" style={{ background: 'linear-gradient(270deg, rgba(40,25,10,.28) 0%, rgba(40,25,10,.06) 60%, rgba(40,25,10,0) 100%)' }} /></div>
            </div>
          )}
          {s > 0 && s < maxS && !flip && <button type="button" className="fb-corner" aria-label="Turn the page" onClick={() => turn('next')} />}
        </div>
      </div>
      <div className="fb-ctrl">
        <button type="button" className="sq-btn" aria-label="Previous page" onClick={() => turn('prev')} disabled={s <= 0}><ChevL /></button>
        <div className="mid">
          <span className="lbl" aria-live="polite">{label}</span>
          <div className="dots">{Array.from({ length: maxS + 1 }, (_, k) => <span key={k} className={`dot${k === s ? ' on' : ''}`} style={{ cursor: 'default' }} />)}</div>
        </div>
        <button type="button" className="sq-btn" aria-label="Next page" onClick={() => turn('next')} disabled={s >= maxS}><ChevR /></button>
      </div>
    </div>
  );
}

/* ---------- phone: one page at a time ---------- */
function PhoneBook({ book }: { book: FlipBookProps }) {
  const text = useMemo(() => paginate(parseSample(book.sample || ''), 660, 580), [book.sample]);
  const total = text.length + 2; // opener, text pages, end
  const [i, setI] = useState(0);
  const go = (d: number) => setI((c) => Math.max(0, Math.min(total - 1, c + d)));
  const swipe = useSwipe(() => go(1), () => go(-1));
  const isEnd = i === total - 1;
  return (
    <div className="m-reader">
      <div className="m-page" {...swipe}>
        {i === 0 && (
          <div className="opener">
            <span style={{ fontFamily: 'var(--serif-c)', fontSize: 10, letterSpacing: '.3em', color: '#8a6a32' }}>CHAPTER</span>
            <span style={{ fontFamily: 'var(--serif-d)', fontSize: 64, fontWeight: 600, lineHeight: 0.8, color: '#1b1814' }}>One</span>
            {book.chapterTitle && <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 20, color: '#5d5448' }}>{book.chapterTitle}</span>}
            <span style={{ width: 40, height: 1, background: '#8a6a32' }} />
            {book.tagline && <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.4, color: '#6b6152', whiteSpace: 'pre-line', paddingTop: 16 }}>{book.tagline}</span>}
          </div>
        )}
        {i > 0 && !isEnd && (
          <div className="m-text-body">
            <Blocks blocks={text[i - 1]} firstPage={i === 1} mobile />
            {i === text.length && (
              <div className="sp-tail" aria-hidden style={{ paddingTop: 16 }}>
                <span className="l" style={{ width: 32 }} />
                <span className="f" />
                <span className="l" style={{ width: 32 }} />
              </div>
            )}
          </div>
        )}
        {isEnd && (
          <div className="end">
            <span style={{ fontFamily: 'var(--serif-d)', fontStyle: 'italic', fontSize: 26, lineHeight: 1.25, color: '#1b1814' }}>Want to know what happens next?</span>
            {book.amazonUrl && <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark" style={{ alignSelf: 'stretch', padding: '18px 10px' }}>BUY ON AMAZON <Arrow /></a>}
            {book.audibleUrl && <a href={book.audibleUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ alignSelf: 'stretch', border: '1px solid #1b1814', color: '#1b1814', padding: '17px 10px' }}><Headphones />LISTEN ON AUDIBLE</a>}
          </div>
        )}
        {!isEnd && <span className="pn">{i + 1}</span>}
      </div>
      <div className="m-ctrl">
        <button type="button" className="round" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous page"><ChevL /></button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--serif-c)', fontSize: 10, fontWeight: 700, letterSpacing: '.22em', color: '#5b5244' }} aria-live="polite">{i === 0 ? 'CHAPTER ONE' : isEnd ? 'END OF SAMPLE' : `PAGE ${i + 1} OF ${total - 1}`}</span>
          <div className="dots">{Array.from({ length: Math.min(total, 9) }, (_, k) => <span key={k} className="dot" style={{ width: Math.round((i / Math.max(1, total - 1)) * (Math.min(total, 9) - 1)) === k ? 20 : 6, background: Math.round((i / Math.max(1, total - 1)) * (Math.min(total, 9) - 1)) === k ? '#1b1814' : 'rgba(27,24,20,.25)', cursor: 'default' }} />)}</div>
        </div>
        <button type="button" className="round fill" onClick={() => go(1)} disabled={isEnd} aria-label="Next page"><ChevR /></button>
      </div>
      <span style={{ fontSize: 13, color: '#8a8173' }}>Swipe the page or use the arrows</span>
    </div>
  );
}

export default function Flipbook(props: FlipBookProps) {
  return (
    <>
      <DesktopBook book={props} />
      <PhoneBook book={props} />
    </>
  );
}
