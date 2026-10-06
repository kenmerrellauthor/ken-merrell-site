'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeQuote } from '@/lib/types';
import { Ornament } from './Bits';
import { ChevL, ChevR } from './icons';

export default function QuoteCarousel({ quotes }: { quotes: HomeQuote[] }) {
  const n = quotes.length;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const swipeX = useRef<number | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Pause auto-play for 5 s then resume in the given direction. */
  const pauseFor5 = useCallback((newDir?: 1 | -1) => {
    if (newDir !== undefined) setDir(newDir);
    setPaused(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), 5000);
  }, []);

  /** Move by delta, clamped to [0, n-1], and pause auto-play briefly. */
  const step = useCallback((d: 1 | -1) => {
    setIdx((cur) => {
      const next = Math.max(0, Math.min(n - 1, cur + d));
      return next;
    });
    pauseFor5(d);
  }, [n, pauseFor5]);

  /** Jump to a specific index. */
  const goTo = useCallback((target: number) => {
    setIdx((cur) => {
      if (target === cur) return cur;
      pauseFor5(target > cur ? 1 : -1);
      return target;
    });
  }, [pauseFor5]);

  // Auto-play: bounces forward then backward at the ends.
  useEffect(() => {
    if (n < 2 || paused) return;
    const id = setInterval(() => {
      setIdx((cur) => {
        let nextDir = dir;
        if (cur >= n - 1) {
          nextDir = -1;
          setDir(-1);
        } else if (cur <= 0) {
          nextDir = 1;
          setDir(1);
        }
        return Math.max(0, Math.min(n - 1, cur + nextDir));
      });
    }, 6000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, paused, dir]);

  // Cleanup resume timer on unmount.
  useEffect(() => () => { if (resumeRef.current) clearTimeout(resumeRef.current); }, []);

  if (!n) return null;

  return (
    <section
      className="quotes"
      aria-roledescription="carousel"
      aria-label="Quotes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => pauseFor5()}
      onPointerDown={(e) => { swipeX.current = e.clientX; setPaused(true); }}
      onPointerUp={(e) => {
        if (swipeX.current == null) { pauseFor5(); return; }
        const dx = e.clientX - swipeX.current;
        swipeX.current = null;
        if (dx < -40 && idx < n - 1) step(1);
        else if (dx > 40 && idx > 0) step(-1);
        else pauseFor5();
      }}
    >
      <div className="glowbox km-gold-glow" />
      <Ornament />

      <div className="stage" aria-live="polite">
        {quotes.map((q, k) => (
          <div
            key={k}
            className={`q${k === idx ? ' on' : ''}`}
            aria-hidden={k !== idx}
          >
            <p className="big">{q.text?.length > 20 ? q.text.slice(0, 20) + '...' : q.text}</p>
            {q.sub && <p className="sub">{q.sub}</p>}
            {q.who && <span className="who">{q.who}</span>}
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="qctrl">
          <button
            type="button"
            className={`sq-btn${idx > 0 ? ' gold' : ' disabled'}`}
            onClick={() => step(-1)}
            disabled={idx === 0}
            aria-label="Previous quote"
          >
            <ChevL />
          </button>

          <div className="dots">
            {quotes.map((_, k) => (
              <button
                key={k}
                type="button"
                className={`dot${k === idx ? ' on' : ''}`}
                aria-label={`Show quote ${k + 1}`}
                aria-current={k === idx}
                onClick={() => goTo(k)}
              />
            ))}
          </div>

          <button
            type="button"
            className={`sq-btn${idx < n - 1 ? ' gold' : ' disabled'}`}
            onClick={() => step(1)}
            disabled={idx === n - 1}
            aria-label="Next quote"
          >
            <ChevR />
          </button>
        </div>
      )}
    </section>
  );
}
