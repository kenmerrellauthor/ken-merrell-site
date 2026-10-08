'use client';

import React from 'react';
import type { SiteSettings, SocialLink } from '@/lib/types';

interface FooterStickersProps {
  site: SiteSettings;
}

export default function FooterStickers({ site }: FooterStickersProps) {
  // If admin has configured custom social links, use them!
  // Otherwise, default to the 5 standard handles.
  const defaultLinks: SocialLink[] = [
    { platform: 'Instagram', url: 'https://instagram.com/kenmerrell' },
    { platform: 'Facebook', url: 'https://facebook.com/kenmerrell' },
    { platform: 'YouTube', url: site.youtubeUrl || 'https://youtube.com/@kenmerrell' },
    { platform: 'TikTok', url: 'https://tiktok.com/@kenmerrell' },
    { platform: 'X', url: 'https://x.com/kenmerrell' },
  ];

  const configuredLinks = (site.socialLinks && site.socialLinks.length > 0)
    ? site.socialLinks.filter((l) => l.platform && l.url)
    : defaultLinks;

  const linksToRender = configuredLinks.length > 0 ? configuredLinks : defaultLinks;

  // Varied natural sticker tilts for authentic author-desk scrapbook feel
  const tilts = ['-4deg', '3deg', '-1.5deg', '3.5deg', '-3deg', '2deg', '-2.5deg', '4deg'];

  const renderGlyph = (platform: string, customImage?: string, gradId?: string) => {
    const p = platform.toLowerCase().trim();
    const gId = gradId || 'goldGrad';

    if (customImage) {
      return (
        <image
          href={customImage}
          x="18"
          y="18"
          width="64"
          height="64"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#customClip)"
        />
      );
    }

    // Instagram
    if (p.includes('instagram') || p === 'ig') {
      return (
        <g>
          <rect x="25" y="25" width="50" height="50" rx="14" ry="14" fill="none" stroke={`url(#${gId})`} strokeWidth="6.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="13" fill="none" stroke={`url(#${gId})`} strokeWidth="6.5" />
          <circle cx="63.5" cy="36.5" r="3.5" fill={`url(#${gId})`} />
        </g>
      );
    }

    // Facebook
    if (p.includes('facebook') || p === 'fb') {
      return (
        <path
          d="M57 33h7V21h-9c-10 0-14 6-14 15v8h-7v12h7v25h13V56h9l2-12h-11v-6c0-3.5 1.5-5 5-5z"
          fill={`url(#${gId})`}
        />
      );
    }

    // YouTube
    if (p.includes('youtube') || p === 'yt') {
      return (
        <polygon points="46,33 76,50 46,67" fill={`url(#${gId})`} />
      );
    }

    // TikTok
    if (p.includes('tiktok') || p === 'tt') {
      return (
        <path
          d="M56 22c1.8 3.8 5 6.6 9.2 7.7 2.3.6 4.8.7 7.1.3v10.5c-3.7.1-7.3-.8-10.4-2.5v20.4c0 10.8-8.8 19.6-19.6 19.6S22.7 69.2 22.7 58.4s8.8-19.6 19.6-19.6c1.8 0 3.6.3 5.3.7v10.8c-1.6-.6-3.4-.9-5.3-.9-5 0-9 4-9 9s4 9 9 9 9-4 9-9V22h4.7z"
          fill={`url(#${gId})`}
        />
      );
    }

    // X / Twitter
    if (p === 'x' || p.includes('twitter')) {
      return (
        <path
          d="M68 25h7.5L59 44l19.5 26h-15l-11.8-15.5L38.2 70H30.7L48 50.2 29.5 25h15.4l10.6 14.1L68 25zm-2.6 40.5h4.2L42.2 29.2h-4.5l27.7 36.3z"
          fill={`url(#${gId})`}
        />
      );
    }

    // Goodreads
    if (p.includes('goodreads')) {
      return (
        <path
          d="M50 22c-14 0-22 9-22 22 0 12 7 21 19 22v-6c-8-.8-12-6.5-12-16 0-9.5 5.5-16 15-16 9 0 14 6.5 14 16 0 9.2-4 15.5-11 16.5l.8 5.5c12-1.5 18-9.5 18-22C71 31 63 22 50 22zm-7 46c-6 0-11 3.5-11 9 0 6 5.5 9 12 9 8 0 14-5 14-11v-7H43zm5 12c-4 0-7-1.8-7-4.5 0-2.8 3-4.5 7-4.5h3v4.5c0 2.5-1.5 4.5-3 4.5z"
          fill={`url(#${gId})`}
        />
      );
    }

    // Amazon
    if (p.includes('amazon')) {
      return (
        <g fill={`url(#${gId})`}>
          <path d="M48 24c-12 0-20 6.5-20 17 0 9 6.5 15 15.5 15 5.5 0 10.5-2.5 13-6.5v5.5h8.5V26h-8.5v5.5c-2.5-4.5-7.5-7.5-13-7.5zm3.5 25c-6 0-10-4-10-10s4-10 10-10 10 4 10 10-4 10-10 10z" />
          <path d="M22 66c18 6 38 6 56 0 1.5-.5 2.5 1 1.5 2-15 11-44 11-59 0-1-1 0-2.5 1.5-2z" />
        </g>
      );
    }

    // Threads
    if (p.includes('threads')) {
      return (
        <path
          d="M62 47c0-7-5.5-11-12-11-7.5 0-13 5.5-13 14 0 9.5 6 15 14 15 4.5 0 9-2 11-5.5l5.5 4C64 68 58 71 51 71c-13 0-22-9-22-21 0-13 10-22 22-22 11 0 20 7 20 18.5 0 12-8.5 18.5-18.5 18.5-4 0-7.5-1.5-9-4 0 0-2 7 4 7 8 0 13-5 13-5l1.5 6.5s-6 6-15 6c-11 0-18-8-18-18 0-10.5 7.5-18.5 18-18.5 10 0 16 6.5 16 15 0 8.5-5.5 13.5-12.5 13.5-3 0-5.5-1.5-5.5-4.5 0-3.5 2.5-5.5 6-5.5 3 0 5 1 5 1z"
          fill={`url(#${gId})`}
        />
      );
    }

    // BookBub
    if (p.includes('bookbub')) {
      return (
        <g fill={`url(#${gId})`}>
          <path d="M35 24h18c7 0 12 3.5 12 9.5 0 4-2.5 7-6 8.5 5 1.5 8 5 8 10 0 7-6 11-14 11H35V24zm9 17h8c3.5 0 5.5-1.5 5.5-4.5s-2-4.5-5.5-4.5h-8V41zm0 14h9c4 0 6.5-1.8 6.5-5s-2.5-5-6.5-5h-9v10z" />
        </g>
      );
    }

    // Pinterest
    if (p.includes('pinterest')) {
      return (
        <path
          d="M50 20C34 20 22 31.5 22 46.5c0 10.5 6.5 19.5 16 23.5-.2-2-.4-5 .1-7.2l3.5-15s-.9-1.8-.9-4.5c0-4.2 2.5-7.4 5.5-7.4 2.6 0 3.8 2 3.8 4.3 0 2.6-1.7 6.5-2.5 10.1-.7 3.1 1.5 5.6 4.5 5.6 5.4 0 9.6-5.7 9.6-14 0-7.3-5.2-12.4-12.7-12.4-8.7 0-13.8 6.5-13.8 13.3 0 2.6 1 5.4 2.3 7 .3.3.3.6.2 1.1l-.8 3.5c-.1.5-.5.7-.9.5-3.5-1.6-5.7-6.7-5.7-10.8 0-8.8 6.4-16.9 18.5-16.9 9.7 0 17.2 6.9 17.2 16.1 0 9.6-6.1 17.4-14.5 17.4-2.8 0-5.5-1.5-6.4-3.2l-1.8 6.7c-.6 2.4-2.3 5.4-3.4 7.2 2.6.8 5.4 1.2 8.3 1.2 16.5 0 29.5-12.5 29.5-28.5C79.5 31.5 66.5 20 50 20z"
          fill={`url(#${gId})`}
        />
      );
    }

    // Spotify
    if (p.includes('spotify')) {
      return (
        <path
          d="M50 22c-15.5 0-28 12.5-28 28s12.5 28 28 28 28-12.5 28-28-12.5-28-28-28zm12.8 40.4c-.5.8-1.5 1.1-2.3.6-6.3-3.9-14.2-4.7-23.5-2.6-1 .2-1.9-.4-2.1-1.3-.2-.9.4-1.9 1.3-2.1 10.2-2.3 19-1.4 26 2.9.8.5 1.1 1.6.6 2.5zm3.4-7.6c-.6 1-1.9 1.3-2.9.7-7.2-4.4-18.2-5.7-26.7-3.1-1.1.3-2.3-.3-2.6-1.4-.3-1.1.3-2.3 1.4-2.6 9.8-3 21.9-1.5 30.1 3.5.9.6 1.3 1.9.7 2.9zm.3-8c-8.7-5.1-22.9-5.6-31.2-3.1-1.3.4-2.7-.3-3.1-1.7-.4-1.3.3-2.7 1.7-3.1 9.5-2.9 25.2-2.3 35.2 3.6 1.2.7 1.6 2.3.9 3.5-.7 1.1-2.3 1.5-3.5.8z"
          fill={`url(#${gId})`}
        />
      );
    }

    // LinkedIn
    if (p.includes('linkedin')) {
      return (
        <path
          d="M32 30c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm-1 12H21v30h10V42zm16 0h-9.5v30h9.5V56.5c0-7.5 9.5-8 9.5 0V72h9.5V53.5c0-14-15-13.5-19-6.5V42z"
          fill={`url(#${gId})`}
        />
      );
    }

    // Default / Custom: Elegant Vintage Author Monogram Crest
    const initial = platform.charAt(0).toUpperCase() || 'K';
    return (
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="var(--serif-c), Georgia, serif"
        fontSize="36"
        fontWeight="700"
        letterSpacing="0.05em"
        fill={`url(#${gId})`}
      >
        {initial}
      </text>
    );
  };

  return (
    <div className="footer-stickers-wrap" aria-label="Follow Ken Merrell on social media">
      {/* Clean responsive sticker shelf - styled in exact site color palette */}
      <div className="footer-stickers-shelf">
        {linksToRender.map((stk, idx) => {
          const tilt = tilts[idx % tilts.length];
          const isCircle = stk.platform.toLowerCase().includes('facebook') || stk.platform.toLowerCase() === 'fb';
          const isWide = stk.platform.toLowerCase().includes('youtube') || stk.platform.toLowerCase() === 'yt';
          const gradId = `siteGoldGrad-${idx}`;

          return (
            <a
              key={`${stk.platform}-${idx}`}
              href={stk.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`footer-sticker-item stk-${stk.platform.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
              style={{ '--stk-tilt': tilt } as React.CSSProperties}
              title={`Follow Ken Merrell on ${stk.platform}`}
              aria-label={`Follow Ken Merrell on ${stk.platform}`}
            >
              <div className="sticker-shadow" />
              <div className="sticker-body">
                <svg viewBox={isWide ? '0 0 112 100' : '0 0 100 100'} className="sticker-svg" aria-hidden="true">
                  <defs>
                    {/* Website Cream Parchment Gradient */}
                    <linearGradient id={`paperGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f4ecdc" />
                      <stop offset="60%" stopColor="#efe7d6" />
                      <stop offset="100%" stopColor="#cfc4ae" />
                    </linearGradient>

                    {/* Website Deep Ink Gradient (matches footer & dark panels) */}
                    <radialGradient id={`slateGrad-${idx}`} cx="45%" cy="40%" r="65%">
                      <stop offset="0%" stopColor="#1a1613" />
                      <stop offset="70%" stopColor="#120f0d" />
                      <stop offset="100%" stopColor="#0a0908" />
                    </radialGradient>

                    {/* Website Signature Gold Gradient (--gold-hi -> --gold -> --brown) */}
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e2c683" />
                      <stop offset="45%" stopColor="#c9a860" />
                      <stop offset="85%" stopColor="#96742e" />
                      <stop offset="100%" stopColor="#7a5c1e" />
                    </linearGradient>

                    {/* Gilded Border Rim Gradient */}
                    <linearGradient id={`goldRim-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e2c683" />
                      <stop offset="50%" stopColor="#c9a860" />
                      <stop offset="100%" stopColor="#7a5c1e" />
                    </linearGradient>

                    <filter id={`emboss-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.85" />
                    </filter>
                    <clipPath id="customClip">
                      <rect x="18" y="18" width="64" height="64" rx="14" ry="14" />
                    </clipPath>
                  </defs>

                  {/* Outer Parchment Paper Die-Cut Rim with Gilded Gold Stroke */}
                  {isCircle ? (
                    <circle cx="50" cy="50" r="46" fill={`url(#paperGrad-${idx})`} stroke={`url(#goldRim-${idx})`} strokeWidth="1.8" />
                  ) : isWide ? (
                    <rect x="5" y="8" width="102" height="84" rx="26" ry="26" fill={`url(#paperGrad-${idx})`} stroke={`url(#goldRim-${idx})`} strokeWidth="1.8" />
                  ) : (
                    <rect x="4" y="4" width="92" height="92" rx="27" ry="27" fill={`url(#paperGrad-${idx})`} stroke={`url(#goldRim-${idx})`} strokeWidth="1.8" />
                  )}

                  {/* Charcoal Deep Ink Inner Disk */}
                  {isCircle ? (
                    <circle cx="50" cy="50" r="39.5" fill={`url(#slateGrad-${idx})`} stroke="rgba(201, 168, 96, 0.4)" strokeWidth="1" />
                  ) : isWide ? (
                    <rect x="11" y="14" width="90" height="72" rx="20" ry="20" fill={`url(#slateGrad-${idx})`} stroke="rgba(201, 168, 96, 0.4)" strokeWidth="1" />
                  ) : (
                    <rect x="10" y="10" width="80" height="80" rx="22" ry="22" fill={`url(#slateGrad-${idx})`} stroke="rgba(201, 168, 96, 0.4)" strokeWidth="1" />
                  )}

                  {/* Inner Fine Gold Inset Ring */}
                  {isCircle ? (
                    <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(226, 198, 131, 0.3)" strokeWidth="0.8" />
                  ) : isWide ? (
                    <rect x="14" y="17" width="84" height="66" rx="17" ry="17" fill="none" stroke="rgba(226, 198, 131, 0.3)" strokeWidth="0.8" />
                  ) : (
                    <rect x="13" y="13" width="74" height="74" rx="19" ry="19" fill="none" stroke="rgba(226, 198, 131, 0.3)" strokeWidth="0.8" />
                  )}

                  {/* Embossed Website Gold Foil Icon */}
                  <g filter={`url(#emboss-${idx})`}>
                    {renderGlyph(stk.platform, stk.image, gradId)}
                  </g>

                  {/* Top Surface Vinyl Glare */}
                  <path d="M12 12 Q50 8 78 30 L50 65 Q20 50 12 12 Z" fill="rgba(255,255,255,0.09)" pointerEvents="none" />
                </svg>
                <div className="sticker-peel-shimmer" />
              </div>
              <span className="sticker-tooltip">{stk.platform}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
