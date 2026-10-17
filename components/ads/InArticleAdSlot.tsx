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

  const adTitle = adConfig?.title?.trim() || 'Petticoats and Ash';
  const adLabel = adConfig?.label?.trim() || 'SPONSORED NOVEL';
  const adBadge = adConfig?.badge?.trim() || '★ HISTORICAL SUSPENSE';
  const ctaText = adConfig?.primaryBtnText?.trim() || 'EXPLORE NOVEL';
  const isExternal = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://');

  const BannerContent = (
    <div className="in-article-ad-card">
      {/* Top Sponsored Ad Disclosure Header */}
      <div className="in-article-ad-header">
        <div className="in-article-ad-sponsor">
          <span className="in-article-ad-dot" />
          <span>SPONSORED ADVERTISEMENT</span>
        </div>
        <div className="in-article-ad-tag">
          <span>{adLabel}</span>
        </div>
      </div>

      {/* Main Clickable Banner Frame */}
      <div className="in-article-banner-frame">
        {/* 4 Decorative vintage gold corner accents */}
        <span className="corner-accent corner-tl" />
        <span className="corner-accent corner-tr" />
        <span className="corner-accent corner-bl" />
        <span className="corner-accent corner-br" />

        {/* Top-Right Sponsored Badge */}
        <div className="in-article-ad-pill">
          <span className="pill-dot">✦</span>
          <span>SPONSORED</span>
        </div>

        {/* Banner Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerSrc}
          alt={adTitle}
          className="in-article-ad-img"
        />

        {/* Bottom Ad Action Bar Overlay */}
        <div className="in-article-ad-overlay">
          <div className="in-article-ad-info">
            <span className="in-article-ad-badge-text">{adBadge}</span>
            <strong className="in-article-ad-title">{adTitle}</strong>
          </div>
          <span className="in-article-ad-cta">
            <span>{ctaText}</span>
            <span className="in-article-ad-arrow">↗</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <aside
      id={slotId}
      className="in-article-banner-wrap"
      aria-label={`Sponsored Advertisement: ${adTitle}`}
    >
      {isExternal ? (
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="in-article-banner-link"
          title={`Click to view: ${adTitle}`}
        >
          {BannerContent}
        </a>
      ) : (
        <Link
          href={destinationUrl}
          className="in-article-banner-link"
          title={`Click to view: ${adTitle}`}
        >
          {BannerContent}
        </Link>
      )}
    </aside>
  );
}
