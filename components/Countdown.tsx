'use client';
import { useEffect, useState } from 'react';

export default function Countdown({ date, label }: { date: string; label: string }) {
  const target = date ? new Date(date + 'T09:00:00').getTime() : NaN;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const left = now != null && !Number.isNaN(target) ? Math.max(0, target - now) : null;
  const days = left != null ? Math.floor(left / 86_400_000) : null;
  const hours = left != null ? Math.floor((left % 86_400_000) / 3_600_000) : null;
  return (
    <div className="countdown">
      {!Number.isNaN(target) && (
        <>
          <div className="box"><span className="v">{days == null ? '··' : String(days).padStart(2, '0')}</span><span className="k">DAYS</span></div>
          <div className="box"><span className="v">{hours == null ? '··' : String(hours).padStart(2, '0')}</span><span className="k">HOURS</span></div>
        </>
      )}
      {label && <div className="wide"><span className="k">EXPECTED</span><span className="v">{label}</span></div>}
    </div>
  );
}
