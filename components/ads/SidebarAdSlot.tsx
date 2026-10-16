import React from 'react';
import Link from 'next/link';
import type { Book, SidebarAdItem } from '@/lib/types';
import { Cover } from '@/components/Bits';

interface Props {
  position: 'left' | 'right';
  book?: Book | null;
  slotId?: string;
  label?: string;
  adConfig?: SidebarAdItem | null;
}

export default function SidebarAdSlot({ position, book, slotId, label = 'ADVERTISEMENT', adConfig }: Props) {
  // If explicitly disabled in admin settings, do not render
  if (adConfig && adConfig.enabled === false) {
    return null;
  }

  const defaultSlotId = slotId || (position === 'left' ? 'ad-slot-skyscraper-left' : 'ad-slot-skyscraper-right');
  const adLabel = adConfig?.label?.trim() || label;
  const badgeText = adConfig?.badge?.trim() || (position === 'left' ? '★ BESTSELLER' : '⚡ NEW RELEASE');
  const adTitle = adConfig?.title?.trim() || book?.title || 'Featured Novel';
  const coverUrl = adConfig?.coverImage?.trim() || book?.cover || null;
  const ratingCount = adConfig?.ratingStars ?? 5;
  const stars = '★'.repeat(Math.max(1, Math.min(5, ratingCount)));
  const tagline = adConfig?.tagline?.trim() || book?.tagline || (book?.description ? book.description.slice(0, 80) + '...' : 'A gripping historical suspense novel by Ken Merrell.');
  const primaryUrl = adConfig?.primaryBtnUrl?.trim() || book?.amazonUrl || '#';
  const primaryText = adConfig?.primaryBtnText?.trim() || (primaryUrl.includes('amazon') ? 'BUY ON AMAZON ↗' : 'GET THE BOOK ↗');
  const secondaryUrl = adConfig?.secondaryBtnUrl?.trim() || (book?.slug ? `/books/${book.slug}` : undefined);
  const secondaryText = adConfig?.secondaryBtnText?.trim() || 'READ SAMPLE';

  return (
    <aside
      id={defaultSlotId}
      className={`sidebar-ad-rail sidebar-ad-${position}`}
      aria-label={`${adLabel} (${position} sidebar)`}
      style={{
        width: 170,
        flexShrink: 0,
        position: 'sticky',
        top: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignSelf: 'flex-start',
      }}
    >
      {/* Ad Disclosure Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '4px 0',
          borderBottom: '1px solid rgba(201, 168, 96, 0.2)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--gold, #c9a860)',
            opacity: 0.85,
          }}
        >
          {adLabel}
        </span>
      </div>

      {/* Skyscraper Card Container (160x600 Standard Vertical Ad Unit) */}
      <div
        style={{
          width: '100%',
          minHeight: 560,
          background: 'linear-gradient(180deg, rgba(28, 23, 18, 0.95) 0%, rgba(14, 12, 10, 0.98) 100%)',
          border: '1px solid rgba(201, 168, 96, 0.25)',
          borderRadius: 6,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative gold corner notches */}
        <span style={{ position: 'absolute', top: 3, left: 3, width: 6, height: 6, borderTop: '1px solid var(--gold, #c9a860)', borderLeft: '1px solid var(--gold, #c9a860)' }} />
        <span style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderTop: '1px solid var(--gold, #c9a860)', borderRight: '1px solid var(--gold, #c9a860)' }} />
        <span style={{ position: 'absolute', bottom: 3, left: 3, width: 6, height: 6, borderBottom: '1px solid var(--gold, #c9a860)', borderLeft: '1px solid var(--gold, #c9a860)' }} />
        <span style={{ position: 'absolute', bottom: 3, right: 3, width: 6, height: 6, borderBottom: '1px solid var(--gold, #c9a860)', borderRight: '1px solid var(--gold, #c9a860)' }} />

        {/* If custom HTML / script tag was provided */}
        {adConfig?.customHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: adConfig.customHtml }}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>
            <span
              style={{
                fontSize: 10,
                color: 'var(--gold, #c9a860)',
                letterSpacing: '0.1em',
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {badgeText}
            </span>

            {/* Book / Custom Banner Cover */}
            <div
              style={{
                width: 110,
                height: 165,
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                borderRadius: 3,
                overflow: 'hidden',
                margin: '6px 0 12px',
                border: '1px solid rgba(201, 168, 96, 0.3)',
                background: '#15120f',
              }}
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={adTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : book ? (
                <Cover book={book} w={110} h={165} title={11} author={6} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold, #c9a860)', fontSize: 10 }}>
                  KM AD
                </div>
              )}
              <div className="km-spine abs" />
            </div>

            {/* Title */}
            <h4
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 14,
                color: 'var(--cream, #fdfbf7)',
                margin: '0 0 6px',
                lineHeight: 1.3,
                fontWeight: 600,
              }}
            >
              {adTitle}
            </h4>

            {/* Stars */}
            <div style={{ color: 'var(--gold, #c9a860)', fontSize: 12, margin: '2px 0 8px', letterSpacing: 2 }}>
              {stars}
            </div>

            {/* Hook */}
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.45,
                color: '#b8ad9e',
                margin: '0 0 16px',
                fontStyle: 'italic',
                flex: 1,
              }}
            >
              &ldquo;{tagline}&rdquo;
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 'auto' }}>
              {primaryUrl && primaryUrl !== '#' && (
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn pri"
                  style={{
                    fontSize: 10.5,
                    padding: '8px 10px',
                    letterSpacing: '0.08em',
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
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
                    fontSize: 10,
                    padding: '6px 8px',
                    letterSpacing: '0.08em',
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  {secondaryText}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>
        160 × 600 Skyscraper
      </div>
    </aside>
  );
}
