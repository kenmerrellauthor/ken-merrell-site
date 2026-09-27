'use client';
import { useEffect, useRef, useState } from 'react';
import type { HomeQuote } from '@/lib/types';
import { Ornament } from './Bits';
import { ChevL, ChevR } from './icons';

export default function QuoteCarousel({ quotes }: { quotes: HomeQuote[] }) {
  const n = quotes.length;
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const sx = useRef<number | null>(null);
  useEffect(() => {
    if (!auto || n < 2) return;
    const t = setInterval(() => setI((c) => (c + 1) % n), 7000);
    return () => clearInterval(t);
  }, [auto, n]);
  if (!n) return null;
  const step = (d: number) => { setAuto(false); setI((c) => (c + d + n) % n); };
  return (
    <section
      className="quotes"
      aria-roledescription="carousel"
      aria-label="Quotes"
      onPointerDown={(e) => { sx.current = e.clientX; }}
      onPointerUp={(e) => {
        if (sx.current == null) return;
        const dx = e.clientX - sx.current;
        sx.current = null;
        if (dx < -50) step(1);
        else if (dx > 50) step(-1);
      }}
    >
      <div className="glowbox km-gold-glow" />
      <Ornament />
      <div className="stage" aria-live="polite">
        {quotes.map((q, k) => (
          <div key={k} className={`q${k === i ? ' on' : ''}`} aria-hidden={k !== i}>
            <p className="big">{q.text}</p>
            {q.sub && <p className="sub">{q.sub}</p>}
            {q.who && <span className="who">{q.who}</span>}
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="qctrl">
          <button type="button" className="sq-btn" onClick={() => step(-1)} aria-label="Previous quote"><ChevL /></button>
          <div className="dots">
            {quotes.map((_, k) => (
              <button key={k} type="button" className={`dot${k === i ? ' on' : ''}`} aria-label={`Show quote ${k + 1}`} aria-current={k === i} onClick={() => { setAuto(false); setI(k); }} />
            ))}
          </div>
          <button type="button" className="sq-btn gold" onClick={() => step(1)} aria-label="Next quote"><ChevR /></button>
        </div>
      )}
    </section>
  );
}
