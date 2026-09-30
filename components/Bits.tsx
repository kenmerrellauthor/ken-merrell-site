import type { Book } from '@/lib/types';
import { Fragment } from 'react';

/** Renders "Petticoats *and a*|Traitor’s Death" as the design's two-tone title. */
export function DisplayTitle({ text }: { text: string }) {
  const lines = text.split('|');
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, pi) =>
            part.startsWith('*') ? <span key={pi} className="gold-em">{part.slice(1, -1)}</span> : <Fragment key={pi}>{part}</Fragment>
          )}
        </Fragment>
      ))}
    </>
  );
}


export function Eyebrow({ num, text, dark }: { num?: string; text: string; dark?: boolean }) {

  return (
    <div className={`eyebrow${dark ? ' dark' : ''}`}>
      {num && <span className="num">{num}</span>}
      <span className="line" />
      <span className="txt">{text}</span>
    </div>
  );
}

function clothWords(title: string) {
  const t = title.replace(/^\[|\]$/g, '');
  const words = t.split(' ');
  if (words.length <= 1) return [title];
  const half = Math.ceil(words.length / 2);
  const bracket = title.startsWith('[');
  return [(bracket ? '[' : '') + words.slice(0, half).join(' '), words.slice(half).join(' ') + (bracket ? ']' : '')];
}

/** Cover image, or the design's cloth hardback when there is no artwork yet. */
export function Cover({ book, w, h, title = 23, author = 11, priority }: { book: Book; w: number | string; h: number | string; title?: number; author?: number; priority?: boolean }) {
  if (book.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={book.cover} alt={`${book.title} cover`} width={typeof w === 'number' ? w : undefined} height={typeof h === 'number' ? h : undefined} loading={priority ? 'eager' : 'lazy'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    );
  }
  const base = typeof w === 'number' ? w : 176;
  const cq = (px: number) => `${((px / base) * 100).toFixed(2)}cqw`;
  return (
    <div className="cloth" style={{ width: '100%', height: '100%', background: book.clothColor, containerType: 'inline-size' }} role="img" aria-label={`${book.title} cover`}>
      <div className="km-linen abs" />
      <div className="b1" />
      <div className="b2" />
      <div className="in">
        <span className="dia" />
        <span className="t" style={{ fontSize: cq(title) }}>
          {clothWords(book.title).map((l, i) => (
            <Fragment key={i}>{i > 0 && <br />}{l}</Fragment>
          ))}
        </span>
        <span className="a" style={{ fontSize: cq(author) }}>KEN MERRELL</span>
      </div>
    </div>
  );
}

const spineBg = ['linear-gradient(90deg,#0f0a07 0%,#2a1d14 20%,#3d2d20 50%,#2a1d14 80%,#0f0a07 100%)', 'linear-gradient(90deg,#120f0b 0%,#2e271e 20%,#443a2c 50%,#2e271e 80%,#120f0b 100%)', 'linear-gradient(90deg,#140c07 0%,#33200f 20%,#4a3018 50%,#33200f 80%,#140c07 100%)'];

/** The floating 3D hardback from the homepage banner and book page. */
export function Book3D({ book, w = 400, h = 600, i = 0 }: { book: Book; w?: number; h?: number; i?: number }) {
  const d = 58;
  return (
    <div className="scene" style={{ width: w + 40, height: h + 30 }}>
      <div className="glow km-glow" />
      <div className="floor km-floor" />
      <div className="book3d" style={{ width: w, height: h }}>
        <div className="bface" style={{ width: w, height: h, background: '#1a120c', borderRadius: 3, transform: `rotateY(180deg) translateZ(${d / 2}px)` }} />
        <div className="bface km-pagetop" style={{ left: 3, top: h / 2 - d / 2, width: w - 10, height: d, transform: `rotateX(90deg) translateZ(${h / 2 - 4}px)` }} />
        <div className="bface km-pagetop" style={{ left: 3, top: h / 2 - d / 2, width: w - 10, height: d, transform: `rotateX(-90deg) translateZ(${h / 2 - 4}px)` }} />
        <div className="bface km-pageside" style={{ left: w / 2 - d / 2, top: 5, width: d, height: h - 10, transform: `rotateY(90deg) translateZ(${w / 2 - 6}px)` }} />
        <div className="bface spine3d" style={{ left: w / 2 - d / 2, top: 0, width: d, height: h, transform: `rotateY(-90deg) translateZ(${w / 2}px)`, background: spineBg[i % 3] }}>
          <div className="rules"><span /><span className="dim" /></div>
          <span className="st">{book.title.toUpperCase()}</span>
          <span className="dia" />
          <div className="au"><span className="k">KEN</span><span className="m">MERRELL</span></div>
          <div className="rules"><span className="dim" /><span /></div>
        </div>
        <div className="bface" style={{ width: w, height: h, transform: `translateZ(${d / 2}px)`, borderRadius: '2px 4px 4px 2px', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,.35)' }}>
          <Cover book={book} w={w} h={h} title={44} author={18} priority />
          <div className="km-hinge abs" />
          <div className="km-sheen abs" />
        </div>
      </div>
    </div>
  );
}

export function Ornament() {
  return (
    <div className="ornament" aria-hidden>
      <span className="l" /><span className="o" /><span className="f" /><span className="o" /><span className="l" />
    </div>
  );
}

export function Seal({ size, font }: { size: number; font: number }) {
  return (
    <div className="seal km-seal" style={{ width: size, height: size, boxShadow: '0 10px 24px rgba(0,0,0,.55), inset 0 -6px 12px rgba(0,0,0,.35)' }}>
      <div className="ring" style={{ width: size * 0.79, height: size * 0.79, fontSize: font }}>KM</div>
    </div>
  );
}
