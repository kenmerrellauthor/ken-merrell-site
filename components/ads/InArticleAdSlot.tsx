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

  // If custom HTML / external script was configured
  if (adConfig?.customHtml) {
    return (
      <aside
        id={slotId}
        className="in-article-banner-wrap"
        aria-label="Advertisement"
        style={{ margin: '36px 0', width: '100%', overflow: 'hidden' }}
      >
        <div dangerouslySetInnerHTML={{ __html: adConfig.customHtml }} />
      </aside>
    );
  }

  // Resolve banner image source
  let bannerSrc =
    adConfig?.bannerImage?.trim() ||
    (adConfig?.coverImage && (adConfig.coverImage.includes('banner') || !adConfig.coverImage.includes('covers'))
      ? adConfig.coverImage.trim()
      : '');

  if (!bannerSrc) {
    if (adConfig?.bookSlug === 'petticoats-and-a-traitors-death') {
      bannerSrc = '/img/banners/traitor.jpg';
    } else if (adConfig?.bookSlug === 'of-craven-dawn') {
      bannerSrc = '/img/banners/craven.jpg';
    } else {
      bannerSrc = '/img/banners/ash.jpg';
    }
  }

  // Resolve click destination URL
  const destinationUrl =
    adConfig?.primaryBtnUrl?.trim() ||
    (adConfig?.bookSlug
      ? `/books/${adConfig.bookSlug}`
      : 'https://www.amazon.com/Petticoats-Ash-Ken-Merrell/dp/B0HHQKCWZM');

  const adTitle = adConfig?.title?.trim() || 'Ken Merrell Historical Suspense';
  const isExternal = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://');

  const BannerImageElement = (
    <div
      className="in-article-banner-frame"
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid rgba(201, 168, 96, 0.45)',
        boxShadow: '0 14px 40px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(201, 168, 96, 0.25)',
        background: '#120f0c',
        cursor: 'pointer',
      }}
    >
      {/* 4 Decorative vintage gold corner accents */}
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 8,
          height: 8,
          borderTop: '2px solid var(--gold, #c9a860)',
          borderLeft: '2px solid var(--gold, #c9a860)',
          zIndex: 2,
          pointerEvents: 'none',
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
          zIndex: 2,
          pointerEvents: 'none',
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
          zIndex: 2,
          pointerEvents: 'none',
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
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Pure Clickable Banner Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerSrc}
        alt={adTitle}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: 280,
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      />
    </div>
  );

  return (
    <aside
      id={slotId}
      className="in-article-banner-wrap"
      aria-label={`Advertisement: ${adTitle}`}
      style={{
        margin: '36px 0',
        width: '100%',
      }}
    >
      {isExternal ? (
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="in-article-banner-link"
          style={{ display: 'block', textDecoration: 'none' }}
          title={`Click to view: ${adTitle}`}
        >
          {BannerImageElement}
        </a>
      ) : (
        <Link
          href={destinationUrl}
          className="in-article-banner-link"
          style={{ display: 'block', textDecoration: 'none' }}
          title={`Click to view: ${adTitle}`}
        >
          {BannerImageElement}
        </Link>
      )}
    </aside>
  );
}
