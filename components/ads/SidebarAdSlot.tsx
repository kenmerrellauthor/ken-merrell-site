import React from 'react';
import Link from 'next/link';
import type { Book } from '@/lib/types';
import { Cover } from '@/components/Bits';

interface Props {
  position: 'left' | 'right';
  book?: Book | null;
  slotId?: string;
  label?: string;
}

export default function SidebarAdSlot({ position, book, slotId, label = 'ADVERTISEMENT' }: Props) {
  const defaultSlotId = slotId || (position === 'left' ? 'ad-slot-skyscraper-left' : 'ad-slot-skyscraper-right');

  return (
    <aside
      id={defaultSlotId}
      className={`sidebar-ad-rail sidebar-ad-${position}`}
      aria-label={`${label} (${position} sidebar)`}
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
            color: 'var(--gold)',
            opacity: 0.85,
          }}
        >
          {label}
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
        <span style={{ position: 'absolute', top: 3, left: 3, width: 6, height: 6, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)' }} />
        <span style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderTop: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />
        <span style={{ position: 'absolute', bottom: 3, left: 3, width: 6, height: 6, borderBottom: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)' }} />
        <span style={{ position: 'absolute', bottom: 3, right: 3, width: 6, height: 6, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />

        {book ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>
            <span
              style={{
                fontSize: 10,
                color: 'var(--gold)',
                letterSpacing: '0.1em',
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {position === 'left' ? '★ BESTSELLER' : '⚡ NEW RELEASE'}
            </span>

            {/* Book Cover */}
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
              }}
            >
              <Cover book={book} w={110} h={165} title={11} author={6} />
              <div className="km-spine abs" />
            </div>

            {/* Book Title */}
            <h4
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 14,
                color: 'var(--cream)',
                margin: '0 0 6px',
                lineHeight: 1.3,
                fontWeight: 600,
              }}
            >
              {book.title}
            </h4>

            {/* Stars */}
            <div style={{ color: 'var(--gold)', fontSize: 12, margin: '2px 0 8px' }}>
              ★★★★★
            </div>

            {/* Short Hook */}
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
              &ldquo;{book.tagline || (book.description ? book.description.slice(0, 80) + '...' : 'A gripping historical suspense novel by Ken Merrell.')}&rdquo;
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 'auto' }}>
              {book.amazonUrl ? (
                <a
                  href={book.amazonUrl}
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
                  BUY ON AMAZON ↗
                </a>
              ) : null}

              <Link
                href={`/books/${book.slug}`}
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
                READ SAMPLE
              </Link>
            </div>
          </div>
        ) : (
          /* Placeholder / Script Target for External Display Ads */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              color: 'var(--muted)',
              gap: 12,
              padding: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(201, 168, 96, 0.08)',
                border: '1px solid rgba(201, 168, 96, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold)',
                fontSize: 18,
              }}
            >
              📢
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--serif-c, "Cinzel", serif)', letterSpacing: '0.1em', color: 'var(--gold)' }}>
              160 × 600
            </div>
            <p style={{ fontSize: 11, color: '#8c7e6c', margin: 0, lineHeight: 1.4 }}>
              Reserved space for display banner &amp; sponsor ads.
            </p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>
        160 × 600 Skyscraper
      </div>
    </aside>
  );
}
