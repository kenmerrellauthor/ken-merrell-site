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
  const tagline =
    adConfig?.tagline?.trim() ||
    'She survived the war—but what she did to survive haunted her for twenty-five years.';
  const primaryUrl =
    adConfig?.primaryBtnUrl?.trim() ||
    'https://www.amazon.com/Petticoats-Ash-Ken-Merrell/dp/B0HHQKCWZM';
  const primaryText =
    adConfig?.primaryBtnText?.trim() ||
    (primaryUrl.includes('amazon') ? 'BUY ON AMAZON ↗' : 'GET THE BOOK ↗');
  const secondaryUrl = adConfig?.secondaryBtnUrl?.trim() || '/books/petticoats-and-ash#sample';
  const secondaryText = adConfig?.secondaryBtnText?.trim() || 'READ FREE SAMPLE';

  return (
    <aside
      id={slotId}
      className="in-article-banner"
      aria-label={`${adLabel} — ${adTitle}`}
      style={{
        margin: '36px 0',
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(30, 24, 18, 0.98) 0%, rgba(16, 13, 10, 0.99) 100%)',
        border: '1px solid rgba(201, 168, 96, 0.45)',
        borderRadius: 8,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(201, 168, 96, 0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative vintage gold corner accents */}
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 8,
          height: 8,
          borderTop: '2px solid var(--gold, #c9a860)',
          borderLeft: '2px solid var(--gold, #c9a860)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 3,
          right: 3,
          width: 8,
          height: 8,
          borderTop: '2px solid var(--gold, #c9a860)',
          borderRight: '2px solid var(--gold, #c9a860)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 3,
          left: 3,
          width: 8,
          height: 8,
          borderBottom: '2px solid var(--gold, #c9a860)',
          borderLeft: '2px solid var(--gold, #c9a860)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 3,
          right: 3,
          width: 8,
          height: 8,
          borderBottom: '2px solid var(--gold, #c9a860)',
          borderRight: '2px solid var(--gold, #c9a860)',
        }}
      />

      {/* Top Banner Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(201, 168, 96, 0.18)',
          paddingBottom: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--serif-c, "Cinzel", serif)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--gold, #c9a860)',
              fontWeight: 700,
            }}
          >
            {adLabel}
          </span>
          <span
            style={{
              fontSize: 9,
              background: 'rgba(201, 168, 96, 0.14)',
              color: 'var(--gold)',
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid rgba(201, 168, 96, 0.3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {badgeText}
          </span>
        </div>

        <span
          style={{
            fontSize: 9.5,
            color: 'var(--muted, #9e9382)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          SPONSORED
        </span>
      </div>

      {/* If custom HTML / script was configured */}
      {adConfig?.customHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: adConfig.customHtml }}
          style={{ width: '100%', overflow: 'hidden' }}
        />
      ) : (
        /* Horizontal Banner Layout */
        <div className="in-article-banner-body">
          {/* Left: Compact Book Cover */}
          <div className="in-article-banner-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={adTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div className="km-spine abs" />
          </div>

          {/* Center: Details & Hook */}
          <div className="in-article-banner-content">
            <h4
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(18px, 2.2vw, 22px)',
                color: 'var(--cream, #fdfbf7)',
                margin: '0 0 4px',
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              {adTitle}
            </h4>

            {/* Star Rating */}
            <div
              style={{
                color: 'var(--gold, #c9a860)',
                fontSize: 12,
                marginBottom: 6,
                letterSpacing: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{stars}</span>
              <span style={{ fontSize: 11, color: '#c4b8a5', letterSpacing: 0, fontStyle: 'italic' }}>
                Featured Historical Novel
              </span>
            </div>

            {/* Hook / Tagline */}
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: '#ded3c1',
                margin: 0,
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              &ldquo;{tagline}&rdquo;
            </p>
          </div>

          {/* Right: Actions / Call to Action */}
          <div className="in-article-banner-actions">
            {primaryUrl && (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn pri in-article-banner-btn"
                style={{
                  fontSize: 11,
                  padding: '9px 18px',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {primaryText}
              </a>
            )}

            {secondaryUrl && (
              <Link
                href={secondaryUrl}
                style={{
                  fontSize: 11,
                  color: 'var(--gold, #c9a860)',
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  textAlign: 'center',
                  display: 'inline-block',
                }}
                className="hover-gold-link"
              >
                {secondaryText} →
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
