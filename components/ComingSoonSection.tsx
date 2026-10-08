'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Book3D from './Book3D';
import type { Book } from '@/lib/types';

interface ComingSoonSectionProps {
  books: Book[];
  romanNumber?: string; // 'II.'
}

interface CarouselItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  releaseDate: string;
  releaseLabel: string;
  cover: string | null;
  book?: Book;
  isPlaceholder?: boolean;
  variant: 1 | 2 | 3 | 4;
}

export default function ComingSoonSection({
  books,
  romanNumber = 'II.'
}: ComingSoonSectionProps) {
  // Only show books that are actually present in the CRM / data
  const items: CarouselItem[] = (books || []).map((b, idx) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    tagline: b.tagline || 'A new historical novel from Ken Merrell. Join the Advance Readers to receive an early copy.',
    releaseDate: b.releaseDate || '',
    releaseLabel: b.releaseLabel || (idx === 0 ? 'Next Release' : 'Coming Soon'),
    cover: b.cover,
    book: b,
    isPlaceholder: false,
    variant: ((idx % 4) + 1) as 1 | 2 | 3 | 4,
  }));

  const [activeIndex, setActiveIndex] = useState(0);

  // Keep activeIndex within bounds if books list changes
  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  // Swipe / Drag gesture tracking
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const currentDrag = useRef(0);

  const prevSlide = useCallback(() => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const nextSlide = useCallback(() => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const handleDragStart = (clientX: number) => {
    if (items.length <= 1) return;
    isDragging.current = true;
    dragStartX.current = clientX;
    currentDrag.current = 0;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    const diff = clientX - dragStartX.current;
    currentDrag.current = diff;
    // Damped elastic feedback during drag
    setDragOffset(diff * 0.35);
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = currentDrag.current;
    setDragOffset(0);
    if (diff < -45) {
      nextSlide();
    } else if (diff > 45) {
      prevSlide();
    }
    currentDrag.current = 0;
  };

  const safeIndex = items.length > 0 ? (activeIndex % items.length + items.length) % items.length : 0;
  const activeItem = items[safeIndex] || items[0];
  const [displayItem, setDisplayItem] = useState(activeItem);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (activeItem && activeItem.id !== displayItem?.id) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setDisplayItem(activeItem);
        setIsFading(false);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [activeItem, displayItem?.id]);

  // Live countdown state
  const [countdown, setCountdown] = useState<{ days: string; hours: string; mins: string }>({
    days: '52',
    hours: '09',
    mins: '09',
  });

  useEffect(() => {
    const calcCountdown = () => {
      if (!displayItem.releaseDate) {
        setCountdown({ days: '52', hours: '09', mins: '09' });
        return;
      }
      const raw = displayItem.releaseDate.trim();
      const dateStr = raw.length === 10 ? `${raw}T00:00:00` : raw;
      const targetTime = new Date(dateStr).getTime();
      if (Number.isNaN(targetTime)) {
        setCountdown({ days: '52', hours: '09', mins: '09' });
        return;
      }
      const diff = Math.max(0, targetTime - Date.now());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        mins: String(m).padStart(2, '0'),
      });
    };

    calcCountdown();
    const interval = setInterval(calcCountdown, 1000 * 60);
    return () => clearInterval(interval);
  }, [displayItem.releaseDate]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section id="coming" className="cs-section" aria-label="Coming Soon">
      {/* Background Ambience & Lighting */}
      <div className="cs-bg-mesh" />
      <div className="cs-bg-lightbeam" />

      {/* Top Header */}
      <div className="cs-header-wrap">
        <div className="cs-eyebrow">
          <span className="cs-eyebrow-roman">{romanNumber}</span>
          <span className="cs-eyebrow-dash">—</span>
          <span className="cs-eyebrow-text">COMING SOON</span>
        </div>
        <h2 className="cs-main-heading">A new chapter is coming.</h2>
      </div>

      {/* 3D Coverflow Stage (Touch & Mouse Swipeable) */}
      <div
        className={`cs-stage-container ${dragOffset !== 0 ? 'cs-dragging' : ''} ${items.length <= 1 ? 'cs-stage-single' : ''}`}
        onTouchStart={(e) => items.length > 1 && handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => items.length > 1 && handleDragMove(e.touches[0].clientX)}
        onTouchEnd={items.length > 1 ? handleDragEnd : undefined}
        onMouseDown={(e) => items.length > 1 && handleDragStart(e.clientX)}
        onMouseMove={(e) => items.length > 1 && handleDragMove(e.clientX)}
        onMouseUp={items.length > 1 ? handleDragEnd : undefined}
        onMouseLeave={items.length > 1 ? handleDragEnd : undefined}
      >
        {/* 3D Shelf Table / Reflective Surface Glow */}
        <div className="cs-floor-reflection" />

        {/* The Books Track (Persistent DOM nodes with stable key={item.id} for 60fps continuous glide) */}
        <div className="cs-stage-track">
          {items.map((item, index) => {
            const len = items.length;
            let offset = 0;
            if (len > 1) {
              offset = (index - safeIndex) % len;
              if (offset > len / 2) offset -= len;
              if (offset < -len / 2) offset += len;
            }

            const isCenter = offset === 0;
            let slotClass = '';
            if (offset === 0) slotClass = 'cs-slot-0 cs-slot-center';
            else if (offset === -1) slotClass = 'cs-slot--1';
            else if (offset === 1) slotClass = 'cs-slot-1';
            else if (offset === -2) slotClass = 'cs-slot--2';
            else if (offset === 2) slotClass = 'cs-slot-2';
            else if (offset < -2) slotClass = 'cs-slot-hidden-left';
            else slotClass = 'cs-slot-hidden-right';

            return (
              <div
                key={item.id}
                className={`cs-book-slot ${slotClass}`}
                style={
                  dragOffset !== 0
                    ? {
                        transform: `translate3d(calc(var(--slot-x, 0px) + ${dragOffset}px), var(--slot-y, 0px), var(--slot-z, 0px)) scale(var(--slot-scale, 1)) rotateY(var(--slot-rot, 0deg))`,
                        transition: 'none',
                      }
                    : undefined
                }
                onClick={() => {
                  if (!isCenter && Math.abs(currentDrag.current) < 10) {
                    setActiveIndex(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveIndex(index);
                  }
                }}
              >
                <div className="cs-book-inner">
                  <Book3D
                    book={item.book || (item.cover ? ({ cover: item.cover, title: item.title } as Book) : null)}
                    placeholderTitle={!item.cover ? item.title : undefined}
                    variant={item.variant}
                    isCenter={isCenter}
                    priority={isCenter}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Book Details & Call to Action (Smoothly crossfades on book change) */}
      <div className="cs-details-wrap">
        <div className={`cs-details-content ${isFading ? 'cs-details-fading' : ''}`}>
          {/* Label: e.g. "— NEXT RELEASE —" */}
          <div className="cs-release-label">
            <span className="cs-sub-dash">—</span>
            <span className="cs-sub-text">{displayItem.releaseLabel || 'NEXT RELEASE'}</span>
            <span className="cs-sub-dash">—</span>
          </div>

          {/* Title */}
          <h3 className="cs-book-title">{displayItem.title}</h3>

          {/* Tagline / Hook */}
          {displayItem.tagline && (
            <p className="cs-book-tagline">{displayItem.tagline}</p>
          )}

          {/* Live Countdown */}
          <div className="cs-countdown-row" aria-label="Release countdown">
            <div className="cs-cbox">
              <span className="cs-cnum">{countdown.days}</span>
              <span className="cs-clbl">DAYS</span>
            </div>
            <span className="cs-csep">:</span>
            <div className="cs-cbox">
              <span className="cs-cnum">{countdown.hours}</span>
              <span className="cs-clbl">HOURS</span>
            </div>
            <span className="cs-csep">:</span>
            <div className="cs-cbox">
              <span className="cs-cnum">{countdown.mins}</span>
              <span className="cs-clbl">MINS</span>
            </div>
          </div>

          {/* Gold CTA Button */}
          <div className="cs-btn-row">
            <Link
              href={`/advance-readers${displayItem.slug ? `?book=${encodeURIComponent(displayItem.slug)}` : ''}`}
              className="cs-gold-btn"
            >
              BECOME AN ADVANCE READER
            </Link>
          </div>
        </div>

        {/* Pagination Indicator Dots */}
        {items.length > 1 && (
          <div className="cs-pagination" aria-label="Book pagination">
            {items.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                className={`cs-dot ${idx === safeIndex ? 'cs-dot-active' : ''}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Switch to book ${idx + 1}: ${it.title}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
