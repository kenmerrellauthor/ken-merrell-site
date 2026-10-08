'use client';

import React from 'react';
import type { SiteSettings } from '@/lib/types';

interface FooterStickersProps {
  site: SiteSettings;
}

export default function FooterStickers({ site }: { site: SiteSettings }) {
  const findUrl = (name: string, fallback: string) => {
    const match = site.socialLinks?.find(
      (l) =>
        l.platform.toLowerCase() === name.toLowerCase() ||
        (name === 'X' && (l.platform.toLowerCase() === 'x' || l.platform.toLowerCase() === 'twitter'))
    );
    if (match?.url) return match.url;
    if (name.toLowerCase() === 'youtube' && site.youtubeUrl) return site.youtubeUrl;
    return fallback;
  };

  const stickers = [
    {
      id: 'ig',
      name: 'Instagram',
      url: findUrl('Instagram', 'https://instagram.com'),
      handle: '@kenmerrell',
      tilt: '-4deg',
      renderSvg: () => (
        <svg viewBox="0 0 100 100" className="sticker-svg" aria-hidden="true">
          <defs>
            <linearGradient id="paperGrad-ig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4ece0" />
              <stop offset="50%" stopColor="#e9dfce" />
              <stop offset="100%" stopColor="#d8ccb8" />
            </linearGradient>
            <radialGradient id="slateGrad-ig" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#25211c" />
              <stop offset="70%" stopColor="#141210" />
              <stop offset="100%" stopColor="#0a0908" />
            </radialGradient>
            <linearGradient id="goldGrad-ig" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fae7b5" />
              <stop offset="40%" stopColor="#d8b467" />
              <stop offset="80%" stopColor="#b48c3d" />
              <stop offset="100%" stopColor="#926f28" />
            </linearGradient>
            <filter id="emboss-ig" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.85" />
            </filter>
          </defs>
          {/* Deckled Paper Border / Sticker Rim */}
          <rect x="4" y="4" width="92" height="92" rx="27" ry="27" fill="url(#paperGrad-ig)" stroke="#cfc0a7" strokeWidth="1.5" />
          {/* Charcoal Slate Inner Disk */}
          <rect x="10" y="10" width="80" height="80" rx="22" ry="22" fill="url(#slateGrad-ig)" stroke="#3a3227" strokeWidth="1" />
          {/* Subtle Inner Gold Ring */}
          <rect x="13" y="13" width="74" height="74" rx="19" ry="19" fill="none" stroke="rgba(201,168,96,0.22)" strokeWidth="0.8" />
          {/* Gold Embossed Instagram Icon */}
          <g filter="url(#emboss-ig)">
            <rect x="25" y="25" width="50" height="50" rx="14" ry="14" fill="none" stroke="url(#goldGrad-ig)" strokeWidth="6.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="13" fill="none" stroke="url(#goldGrad-ig)" strokeWidth="6.5" />
            <circle cx="63.5" cy="36.5" r="3.5" fill="url(#goldGrad-ig)" />
          </g>
          {/* Glossy Sticker Glare */}
          <path d="M12 12 Q50 8 78 30 L50 65 Q20 50 12 12 Z" fill="rgba(255,255,255,0.08)" pointerEvents="none" />
        </svg>
      ),
    },
    {
      id: 'fb',
      name: 'Facebook',
      url: findUrl('Facebook', 'https://facebook.com'),
      handle: 'Ken Merrell',
      tilt: '3deg',
      renderSvg: () => (
        <svg viewBox="0 0 100 100" className="sticker-svg" aria-hidden="true">
          <defs>
            <linearGradient id="paperGrad-fb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5ede2" />
              <stop offset="50%" stopColor="#eae0d0" />
              <stop offset="100%" stopColor="#d9cdba" />
            </linearGradient>
            <radialGradient id="slateGrad-fb" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#25211c" />
              <stop offset="70%" stopColor="#141210" />
              <stop offset="100%" stopColor="#0a0908" />
            </radialGradient>
            <linearGradient id="goldGrad-fb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fae7b5" />
              <stop offset="40%" stopColor="#d8b467" />
              <stop offset="80%" stopColor="#b48c3d" />
              <stop offset="100%" stopColor="#926f28" />
            </linearGradient>
            <filter id="emboss-fb" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.85" />
            </filter>
          </defs>
          {/* Deckled Circular Paper Rim */}
          <circle cx="50" cy="50" r="46" fill="url(#paperGrad-fb)" stroke="#cfc0a7" strokeWidth="1.5" />
          {/* Charcoal Circular Slate Disk */}
          <circle cx="50" cy="50" r="40" fill="url(#slateGrad-fb)" stroke="#3a3227" strokeWidth="1" />
          <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(201,168,96,0.22)" strokeWidth="0.8" />
          {/* Gold Embossed Facebook 'f' */}
          <g filter="url(#emboss-fb)">
            <path
              d="M57 33h7V21h-9c-10 0-14 6-14 15v8h-7v12h7v25h13V56h9l2-12h-11v-6c0-3.5 1.5-5 5-5z"
              fill="url(#goldGrad-fb)"
            />
          </g>
          {/* Glossy Sticker Glare */}
          <ellipse cx="44" cy="30" rx="30" ry="16" fill="rgba(255,255,255,0.07)" pointerEvents="none" />
        </svg>
      ),
    },
    {
      id: 'yt',
      name: 'YouTube',
      url: findUrl('YouTube', 'https://youtube.com'),
      handle: 'Ken Merrell',
      tilt: '-1.5deg',
      renderSvg: () => (
        <svg viewBox="0 0 112 100" className="sticker-svg" aria-hidden="true">
          <defs>
            <linearGradient id="paperGrad-yt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5ede2" />
              <stop offset="50%" stopColor="#eae0d0" />
              <stop offset="100%" stopColor="#d9cdba" />
            </linearGradient>
            <radialGradient id="slateGrad-yt" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#25211c" />
              <stop offset="70%" stopColor="#141210" />
              <stop offset="100%" stopColor="#0a0908" />
            </radialGradient>
            <linearGradient id="goldGrad-yt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fae7b5" />
              <stop offset="40%" stopColor="#d8b467" />
              <stop offset="80%" stopColor="#b48c3d" />
              <stop offset="100%" stopColor="#926f28" />
            </linearGradient>
            <filter id="emboss-yt" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.85" />
            </filter>
          </defs>
          {/* Deckled TV Rounded Paper Rim */}
          <rect x="5" y="8" width="102" height="84" rx="26" ry="26" fill="url(#paperGrad-yt)" stroke="#cfc0a7" strokeWidth="1.5" />
          {/* Charcoal Slate Inner Disk */}
          <rect x="11" y="14" width="90" height="72" rx="20" ry="20" fill="url(#slateGrad-yt)" stroke="#3a3227" strokeWidth="1" />
          <rect x="14" y="17" width="84" height="66" rx="17" ry="17" fill="none" stroke="rgba(201,168,96,0.22)" strokeWidth="0.8" />
          {/* Gold Embossed YouTube Play Triangle */}
          <g filter="url(#emboss-yt)">
            <polygon points="47,33 76,50 47,67" fill="url(#goldGrad-yt)" />
          </g>
          {/* Glossy Sticker Glare */}
          <path d="M14 16 Q56 12 88 32 L60 65 Q25 45 14 16 Z" fill="rgba(255,255,255,0.08)" pointerEvents="none" />
        </svg>
      ),
    },
    {
      id: 'tt',
      name: 'TikTok',
      url: findUrl('TikTok', 'https://tiktok.com'),
      handle: '@kenmerrell',
      tilt: '3.5deg',
      renderSvg: () => (
        <svg viewBox="0 0 100 100" className="sticker-svg" aria-hidden="true">
          <defs>
            <linearGradient id="paperGrad-tt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5ede2" />
              <stop offset="50%" stopColor="#eae0d0" />
              <stop offset="100%" stopColor="#d9cdba" />
            </linearGradient>
            <radialGradient id="slateGrad-tt" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#25211c" />
              <stop offset="70%" stopColor="#141210" />
              <stop offset="100%" stopColor="#0a0908" />
            </radialGradient>
            <linearGradient id="goldGrad-tt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fae7b5" />
              <stop offset="40%" stopColor="#d8b467" />
              <stop offset="80%" stopColor="#b48c3d" />
              <stop offset="100%" stopColor="#926f28" />
            </linearGradient>
            <filter id="emboss-tt" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.85" />
            </filter>
          </defs>
          {/* Deckled Contour Paper Rim */}
          <rect x="4" y="4" width="92" height="92" rx="27" ry="27" fill="url(#paperGrad-tt)" stroke="#cfc0a7" strokeWidth="1.5" />
          {/* Charcoal Slate Inner Disk */}
          <rect x="10" y="10" width="80" height="80" rx="22" ry="22" fill="url(#slateGrad-tt)" stroke="#3a3227" strokeWidth="1" />
          <rect x="13" y="13" width="74" height="74" rx="19" ry="19" fill="none" stroke="rgba(201,168,96,0.22)" strokeWidth="0.8" />
          {/* Gold Embossed TikTok Note */}
          <g filter="url(#emboss-tt)">
            <path
              d="M56 22c1.8 3.8 5 6.6 9.2 7.7 2.3.6 4.8.7 7.1.3v10.5c-3.7.1-7.3-.8-10.4-2.5v20.4c0 10.8-8.8 19.6-19.6 19.6S22.7 69.2 22.7 58.4s8.8-19.6 19.6-19.6c1.8 0 3.6.3 5.3.7v10.8c-1.6-.6-3.4-.9-5.3-.9-5 0-9 4-9 9s4 9 9 9 9-4 9-9V22h4.7z"
              fill="url(#goldGrad-tt)"
            />
          </g>
          {/* Glossy Sticker Glare */}
          <path d="M12 12 Q50 8 78 30 L50 65 Q20 50 12 12 Z" fill="rgba(255,255,255,0.08)" pointerEvents="none" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X',
      url: findUrl('X', 'https://x.com'),
      handle: '@kenmerrell',
      tilt: '-3deg',
      renderSvg: () => (
        <svg viewBox="0 0 100 100" className="sticker-svg" aria-hidden="true">
          <defs>
            <linearGradient id="paperGrad-x" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5ede2" />
              <stop offset="50%" stopColor="#eae0d0" />
              <stop offset="100%" stopColor="#d9cdba" />
            </linearGradient>
            <radialGradient id="slateGrad-x" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#25211c" />
              <stop offset="70%" stopColor="#141210" />
              <stop offset="100%" stopColor="#0a0908" />
            </radialGradient>
            <linearGradient id="goldGrad-x" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fae7b5" />
              <stop offset="40%" stopColor="#d8b467" />
              <stop offset="80%" stopColor="#b48c3d" />
              <stop offset="100%" stopColor="#926f28" />
            </linearGradient>
            <filter id="emboss-x" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.85" />
            </filter>
          </defs>
          {/* Deckled Paper Border / Sticker Rim */}
          <rect x="4" y="4" width="92" height="92" rx="27" ry="27" fill="url(#paperGrad-x)" stroke="#cfc0a7" strokeWidth="1.5" />
          {/* Charcoal Slate Inner Disk */}
          <rect x="10" y="10" width="80" height="80" rx="22" ry="22" fill="url(#slateGrad-x)" stroke="#3a3227" strokeWidth="1" />
          <rect x="13" y="13" width="74" height="74" rx="19" ry="19" fill="none" stroke="rgba(201,168,96,0.22)" strokeWidth="0.8" />
          {/* Gold Embossed X Mark */}
          <g filter="url(#emboss-x)">
            <path
              d="M68 25h7.5L59 44l19.5 26h-15l-11.8-15.5L38.2 70H30.7L48 50.2 29.5 25h15.4l10.6 14.1L68 25zm-2.6 40.5h4.2L42.2 29.2h-4.5l27.7 36.3z"
              fill="url(#goldGrad-x)"
            />
          </g>
          {/* Glossy Sticker Glare */}
          <path d="M12 12 Q50 8 78 30 L50 65 Q20 50 12 12 Z" fill="rgba(255,255,255,0.08)" pointerEvents="none" />
        </svg>
      ),
    },
  ];

  return (
    <div className="footer-stickers-wrap" aria-label="Follow Ken Merrell on social media">
      <div className="footer-stickers-shelf">
        {stickers.map((stk) => (
          <a
            key={stk.id}
            href={stk.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`footer-sticker-item stk-${stk.id}`}
            style={{ '--stk-tilt': stk.tilt } as React.CSSProperties}
            title={`${stk.name} · ${stk.handle}`}
            aria-label={`Follow Ken Merrell on ${stk.name}`}
          >
            <div className="sticker-shadow" />
            <div className="sticker-body">
              {stk.renderSvg()}
              <div className="sticker-peel-shimmer" />
            </div>
            <span className="sticker-tooltip">{stk.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
