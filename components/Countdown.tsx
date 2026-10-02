'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Countdown({ date, label }: { date: string; label: string }) {
  const router = useRouter();
  const dateStr = date ? (date.length === 10 ? `${date}T00:00:00` : date) : '';
  const target = dateStr ? new Date(dateStr).getTime() : NaN;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => {
      const current = Date.now();
      setNow(current);
      // When target is reached, trigger page refresh so the book immediately shifts into available books!
      if (!Number.isNaN(target) && current >= target) {
        clearInterval(t);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [target, router]);

  const left = now != null && !Number.isNaN(target) ? Math.max(0, target - now) : null;
  const isOver = left !== null && left === 0;
  const days = left != null ? Math.floor(left / 86_400_000) : null;
  const hours = left != null ? Math.floor((left % 86_400_000) / 3_600_000) : null;
  const minutes = left != null ? Math.floor((left % 3_600_000) / 60_000) : null;
  const seconds = left != null ? Math.floor((left % 60_000) / 1000) : null;

  return (
    <div className="countdown" aria-label="Release countdown">
      {!Number.isNaN(target) && !isOver && (
        <>
          <div className="box">
            <span className="v">{days == null ? '··' : String(days).padStart(2, '0')}</span>
            <span className="k">DAYS</span>
          </div>
          <div className="box">
            <span className="v">{hours == null ? '··' : String(hours).padStart(2, '0')}</span>
            <span className="k">HOURS</span>
          </div>
          <div className="box">
            <span className="v">{minutes == null ? '··' : String(minutes).padStart(2, '0')}</span>
            <span className="k">MINS</span>
          </div>
          <div className="box">
            <span className="v" style={{ color: 'var(--gold)' }}>{seconds == null ? '··' : String(seconds).padStart(2, '0')}</span>
            <span className="k">SECS</span>
          </div>
        </>
      )}
      {isOver && (
        <div className="wide" style={{ borderColor: 'var(--gold)', background: 'rgba(201,168,96,.12)' }}>
          <span className="k" style={{ color: 'var(--gold)' }}>RELEASED</span>
          <span className="v" style={{ fontSize: 24 }}>NOW AVAILABLE</span>
        </div>
      )}
      {label && !isOver && (
        <div className="wide">
          <span className="k">EXPECTED</span>
          <span className="v">{label}</span>
        </div>
      )}
    </div>
  );
}
