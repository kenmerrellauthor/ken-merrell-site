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
  // Prepare list of carousel items. Ensure at least 5 items for the signature 5-book perspective arc.
  const realItems: CarouselItem[] = books.map((b, idx) => ({
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

  const leftPlaceholders: CarouselItem[] = [
    {
      id: 'vol-left-1',
      slug: 'upcoming-volume-1',
      title: 'Upcoming Ken Merrell Novel',
      tagline: 'Ken Merrell’s next immersive tale of early American secrets and resilience.',
      releaseDate: '',
      releaseLabel: 'Cover Reveal Soon',
      cover: null,
      isPlaceholder: true,
      variant: 1,
    },
    {
      id: 'vol-left-2',
      slug: 'upcoming-volume-2',
      title: 'Upcoming Ken Merrell Novel',
      tagline: 'The story continues. Keep an eye out for exclusive advance reader opportunities.',
      releaseDate: '',
      releaseLabel: 'Cover Reveal Soon',
      cover: null,
      isPlaceholder: true,
      variant: 2,
    },
  ];

  const rightPlaceholders: CarouselItem[] = [
    {
      id: 'vol-right-1',
      slug: 'upcoming-volume-3',
      title: 'Upcoming Ken Merrell Novel',
      tagline: 'Another gripping chapter of historical suspense from author Ken Merrell.',
      releaseDate: '',
      releaseLabel: 'Cover Reveal Soon',
      cover: null,
      isPlaceholder: true,
      variant: 3,
    },
    {
      id: 'vol-right-2',
      slug: 'upcoming-volume-4',
      title: 'Upcoming Ken Merrell Novel',
      tagline: 'Behind the scenes chapters and early reviews coming to the advance reading team.',
      releaseDate: '',
      releaseLabel: 'Cover Reveal Soon',
      cover: null,
      isPlaceholder: true,
      variant: 4,
    },
  ];

  let items: CarouselItem[] = [];
  if (realItems.length === 1) {
    items = [leftPlaceholders[0], leftPlaceholders[1], realItems[0], rightPlaceholders[0], rightPlaceholders[1]];
  } else if (realItems.length === 2) {
    items = [leftPlaceholders[0], leftPlaceholders[1], realItems[0], realItems[1], rightPlaceholders[1]];
  } else {
    items = realItems;
    while (items.length < 5) {
      items.push(rightPlaceholders[items.length % rightPlaceholders.length]);
    }
  }

  const initialIndex = items.findIndex((it) => !it.isPlaceholder);
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 2);

  // Swipe / Drag support (touch & mouse)
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragDistance = useRef(0);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    dragStartX.current = clientX;
    dragDistance.current = 0;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    dragDistance.current = clientX - dragStartX.current;
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragDistance.current < -45) {
      nextSlide();
    } else if (dragDistance.current > 45) {
      prevSlide();
    }
    dragDistance.current = 0;
  };

  // Live countdown state
  const activeItem = items[activeIndex];
  const [countdown, setCountdown] = useState<{ days: string; hours: string; mins: string }>({
    days: '52',
    hours: '09',
    mins: '09',
  });

  useEffect(() => {
    const calcCountdown = () => {
      if (!activeItem.releaseDate) {
        // Fallback default ~52 days matching the design picture
        setCountdown({ days: '52', hours: '09', mins: '09' });
        return;
      }
      const raw = activeItem.releaseDate.trim();
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
  }, [activeItem.releaseDate]);

  // Compute circular offsets for 5 slots: -2, -1, 0, 1, 2
  const visibleIndices: { offset: number; index: number }[] = [-2, -1, 0, 1, 2].map((offset) => {
    const len = items.length;
    let idx = (activeIndex + offset) % len;
    if (idx < 0) idx += len;
    return { offset, index: idx };
  });

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

      {/* 3D Coverflow Stage (Mouse and Touch Swipeable) */}
      <div
        className="cs-stage-container"
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* 3D Shelf Table / Reflective Surface Glow */}
        <div className="cs-floor-reflection" />

        {/* The 5 Positioned Books */}
        <div className="cs-stage-track">
          {visibleIndices.map(({ offset, index }) => {
            const item = items[index];
            const isCenter = offset === 0;

            return (
              <div
                key={`${item.id}-${offset}`}
                className={`cs-book-slot cs-slot-${offset} ${isCenter ? 'cs-slot-center' : ''}`}
                onClick={() => {
                  if (!isCenter) setActiveIndex(index);
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
                    placeholderTitle={item.isPlaceholder ? item.title : undefined}
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

      {/* Active Book Details & Call to Action (Updates dynamically on swipe) */}
      <div className="cs-details-wrap">
        <div className="cs-details-content" key={activeItem.id}>
          {/* Label: e.g. "— NEXT RELEASE —" */}
          <div className="cs-release-label">
            <span className="cs-sub-dash">—</span>
            <span className="cs-sub-text">{activeItem.releaseLabel || 'NEXT RELEASE'}</span>
            <span className="cs-sub-dash">—</span>
          </div>

          {/* Title */}
          <h3 className="cs-book-title">{activeItem.title}</h3>

          {/* Tagline / Hook */}
          {activeItem.tagline && (
            <p className="cs-book-tagline">{activeItem.tagline}</p>
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
              href={`/advance-readers${activeItem.slug ? `?book=${encodeURIComponent(activeItem.slug)}` : ''}`}
              className="cs-gold-btn"
            >
              BECOME AN ADVANCE READER
            </Link>
          </div>
        </div>

        {/* Pagination Indicator Dots */}
        <div className="cs-pagination" aria-label="Book pagination">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              className={`cs-dot ${idx === activeIndex ? 'cs-dot-active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Switch to book ${idx + 1}: ${it.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
