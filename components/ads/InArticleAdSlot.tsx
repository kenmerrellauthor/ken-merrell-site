'use client';

import React from 'react';
import Link from 'next/link';
import type { InArticleAdItem } from '@/lib/types';

interface Props {
  adConfig?: InArticleAdItem | null;
  slotId?: string;
}

export default function InArticleAdSlot({ adConfig, slotId = 'ad-slot-in-article' }: Props) {
  // If explicitly disabled in admin settings, do not render
  if (adConfig && adConfig.enabled === false) {
    return null;
  }

  const adLabel = adConfig?.label?.trim() || 'RECOMMENDED NOVEL';
  const badgeText = adConfig?.badge?.trim() || '★ HISTORICAL SUSPENSE';
  const adTitle = adConfig?.title?.trim() || 'Petticoats and Ash';
  const coverUrl = adConfig?.coverImage?.trim() || '/img/covers/petticoats-and-ash.jpg';
  const ratingCount = adConfig?.ratingStars ?? 5;
  const stars = '★'.repeat(Math.max(1, Math.min(5, ratingCount)));
  const tagline = adConfig?.tagline?.trim() || 'She survived the war—but what she did to survive haunted her for twenty-five years.';
  const primaryUrl = adConfig?.primaryBtnUrl?.trim() || 'https://www.amazon.com/Petticoats-Ash-Ken-Merrell/dp/B0HHQKCWZM';
  const primaryText = adConfig?.primaryBtnText?.trim() || (primaryUrl.includes('amazon') ? 'BUY ON AMAZON ↗' : 'GET THE BOOK ↗');
  const secondaryUrl = adConfig?.secondaryBtnUrl?.trim() || '/books/petticoats-and-ash#sample';
  const secondaryText = adConfig?.secondaryBtnText?.trim() || 'READ FREE SAMPLE';

  return (
    <aside
      id={slotId}
      className="in-article-ad-card"
      aria-label={`${adLabel} — ${adTitle}`}
      style={{
        margin: '36px 0',
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.96) 0%, rgba(14, 12, 10, 0.98) 100%)',
        border: '1px solid rgba(201, 168, 96, 0.35)',
        borderRadius: 8,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(201, 168, 96, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative vintage gold corner accents */}
      <span style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '2px solid var(--gold, #c9a860)', borderLeft: '2px solid var(--gold, #c9a860)' }} />
      <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '2px solid var(--gold, #c9a860)', borderRight: '2px solid var(--gold, #c9a860)' }} />
      <span style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '2px solid var(--gold, #c9a860)', borderLeft: '2px solid var(--gold, #c9a860)' }} />
      <span style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '2px solid var(--gold, #c9a860)', borderRight: '2px solid var(--gold, #c9a860)' }} />

      {/* Top Ad Disclosure Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(201, 168, 96, 0.2)',
          paddingBottom: 10,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--gold, #c9a860)',
            fontWeight: 700,
          }}
        >
          {adLabel}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--muted, #9e9382)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          Sponsored by Ken Merrell
        </span>
      </div>

      {/* If custom HTML / script tag was provided */}
      {adConfig?.customHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: adConfig.customHtml }}
          style={{ width: '100%', overflow: 'hidden' }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 22,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Book / Custom Banner Cover */}
          <div
            style={{
              width: 105,
              height: 158,
              flexShrink: 0,
              position: 'relative',
              boxShadow: '0 10px 28px rgba(0,0,0,0.8)',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(201, 168, 96, 0.35)',
              background: '#15120f',
              margin: '0 auto',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={adTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div className="km-spine abs" />
          </div>

          {/* Details & Copy */}
          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--gold, #c9a860)',
                letterSpacing: '0.12em',
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                fontWeight: 700,
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              {badgeText}
            </div>

            <h4
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(18px, 1.8vw, 22px)',
                color: 'var(--cream, #fdfbf7)',
                margin: '0 0 6px',
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              {adTitle}
            </h4>

            {/* Stars */}
            <div style={{ color: 'var(--gold, #c9a860)', fontSize: 13, marginBottom: 10, letterSpacing: 2 }}>
              {stars}{' '}
              <span style={{ fontSize: 11, color: 'var(--muted, #9e9382)', letterSpacing: 0, marginLeft: 4 }}>
                (5.0 Rating)
              </span>
            </div>

            {/* Hook / Tagline */}
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: '#ded3c1',
                margin: '0 0 16px',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{tagline}&rdquo;
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {primaryUrl && (
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn pri"
                  style={{
                    fontSize: 11,
                    padding: '8px 16px',
                    letterSpacing: '0.08em',
                  }}
                >
                  {primaryText}
                </a>
              )}

              {secondaryUrl && (
                <Link
                  href={secondaryUrl}
                  className="btn sec"
                  style={{
                    fontSize: 11,
                    padding: '8px 14px',
                    letterSpacing: '0.08em',
                  }}
                >
                  {secondaryText}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
