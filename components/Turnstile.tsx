'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';

/** Cloudflare Turnstile in managed mode: invisible for almost every real visitor. Renders nothing without a site key. */
export default function Turnstile({ theme = 'auto' }: { theme?: 'light' | 'dark' | 'auto' }) {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={key} data-theme={theme} data-size="flexible" data-appearance="interaction-only" style={{ position: 'relative' }} />
    </>
  );
}

/** Hidden fields for the honeypot and the time trap. */
export function Traps() {
  return (
    <>
      <div className="hp" aria-hidden>
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <TimeField />
    </>
  );
}

function TimeField() {
  const [t, setT] = useState('');
  useEffect(() => setT(String(Date.now())), []);
  return <input type="hidden" name="_t" value={t} />;
}
