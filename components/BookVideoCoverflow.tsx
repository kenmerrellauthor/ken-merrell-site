'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BookVideo } from '@/lib/types';
import { parseYouTubeId } from '@/lib/youtube';
import { Play, Down } from './icons';

interface BookVideoCoverflowProps {
  videos: BookVideo[];
  bookTitle: string;
  hasSample?: boolean;
}

export default function BookVideoCoverflow({
  videos,
  bookTitle,
  hasSample = false,
}: BookVideoCoverflowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Filter out any videos without a valid YouTube URL
  const validVideos = (videos || []).filter((v) => Boolean(v && v.url && v.url.trim()));
  const total = validVideos.length;

  const safeIndex = total > 0 ? ((activeIndex % total) + total) % total : 0;
  const currentVideo = validVideos[safeIndex] || validVideos[0];

  // Stop video playback when active slide changes
  useEffect(() => {
    setPlayingIndex(null);
  }, [safeIndex]);

  // Drag & Swipe gesture tracking
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const currentDrag = useRef(0);
  const hasSwiped = useRef(false);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  const handleDragStart = (clientX: number) => {
    if (total <= 1) return;
    isDragging.current = true;
    dragStartX.current = clientX;
    currentDrag.current = 0;
    hasSwiped.current = false;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    const diff = clientX - dragStartX.current;
    currentDrag.current = diff;
    // Jitter deadband: only apply visual drag offset if movement > 6px
    if (Math.abs(diff) > 6) {
      setDragOffset(diff * 0.35);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = currentDrag.current;
    setDragOffset(0);

    if (Math.abs(diff) > 35) {
      hasSwiped.current = true;
      if (diff < -35) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setTimeout(() => {
      hasSwiped.current = false;
      currentDrag.current = 0;
    }, 120);
  };

  if (total === 0) return null;

  // Single video layout: elegant cinematic player without carousel overhead
  if (total === 1) {
    const single = validVideos[0];
    const yId = parseYouTubeId(single.url);
    const thumbUrl = single.thumbnail || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : '');
    const isPlaying = playingIndex === 0;

    return (
      <section id="video" className="book-video-section" aria-label="Book Video Trailer">
        <div className="book-video-ambient" />
        <div className="book-video-container">
          <div className="book-video-head">
            <div className="eyebrow">
              <span className="line" />
              <span className="txt">{(single.type || 'OFFICIAL TRAILER').toUpperCase()}</span>
              <span className="line" />
            </div>
            <h2>{single.title || `${bookTitle} — Official Video`}</h2>
            <p className="book-video-sub">
              Watch the official video before diving into the excerpt below.
            </p>
          </div>

          <div className="book-video-frame">
            {isPlaying && yId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${yId}?autoplay=1&rel=0`}
                title={single.title || bookTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="book-video-cover-btn"
                onClick={() => setPlayingIndex(0)}
                aria-label={`Play: ${single.title || bookTitle}`}
              >
                {thumbUrl && (
                  <div
                    className="book-video-thumb-img abs"
                    style={{
                      backgroundImage: `url(${thumbUrl})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
                <div className="abs" style={{ background: 'radial-gradient(ellipse at center, rgba(15,13,11,.15) 0%, rgba(15,13,11,.75) 100%)' }} />
                <div className="km-vignette abs" />
                <div className="vplay big" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                  <div className="core">
                    <Play s={32} />
                  </div>
                </div>
                <div className="book-video-cover-label" style={{
                  position: 'absolute',
                  left: 20,
                  bottom: 20,
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  pointerEvents: 'none'
                }}>
                  <span style={{
                    fontFamily: 'var(--serif-c)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.22em',
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    background: 'rgba(15,13,11,.88)',
                    padding: '6px 14px',
                    borderRadius: 3,
                    border: '1px solid rgba(201,168,96,.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,.6)'
                  }}>
                    WATCH {(single.type || 'VIDEO').toUpperCase()}
                  </span>
                </div>
              </button>
            )}
          </div>

          {hasSample && (
            <a href="#sample" className="book-video-scroll-hint">
              <span>READ THE FIRST CHAPTER</span>
              <Down />
            </a>
          )}
        </div>
      </section>
    );
  }

  // Multi-video Coverflow Carousel
  return (
    <section id="video" className="book-video-section bv-carousel-section" aria-label="Book Videos">
      <div className="book-video-ambient" />

      <div className="bv-container">
        {/* Active Video Header */}
        <div className="book-video-head">
          <div className="eyebrow">
            <span className="line" />
            <span className="txt">{(currentVideo.type || 'FEATURED VIDEO').toUpperCase()}</span>
            <span className="line" />
          </div>
          <h2>{currentVideo.title || `${bookTitle} — Video ${safeIndex + 1}`}</h2>
          <p className="book-video-sub">
            Watch the official trailers, chapter readings, and author discussions. Click any video or swipe to bring it to the front.
          </p>
        </div>

        {/* 3D Coverflow Stage */}
        <div
          className={`bv-stage-container ${dragOffset !== 0 ? 'bv-dragging' : ''}`}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseMove={(e) => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* Reflective floor glow */}
          <div className="bv-floor-reflection" />

          {/* Videos Track */}
          <div className="bv-stage-track">
            {validVideos.map((item, index) => {
              const len = validVideos.length;
              let offset = 0;
              if (len > 1) {
                offset = (index - safeIndex) % len;
                if (offset > len / 2) offset -= len;
                if (offset < -len / 2) offset += len;
              }

              const isCenter = offset === 0;
              let slotClass = '';
              if (offset === 0) slotClass = 'bv-slot-0 bv-slot-center';
              else if (offset === -1) slotClass = 'bv-slot--1';
              else if (offset === 1) slotClass = 'bv-slot-1';
              else if (offset === -2) slotClass = 'bv-slot--2';
              else if (offset === 2) slotClass = 'bv-slot-2';
              else if (offset < -2) slotClass = 'bv-slot-hidden-left';
              else slotClass = 'bv-slot-hidden-right';

              const yId = parseYouTubeId(item.url);
              const thumbUrl = item.thumbnail || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : '');
              const isPlaying = isCenter && playingIndex === index;

              return (
                <div
                  key={item.id || index}
                  className={`bv-video-slot ${slotClass}`}
                  style={
                    dragOffset !== 0
                      ? {
                          transform: `translate3d(calc(var(--bv-slot-x, 0px) + ${dragOffset}px), var(--bv-slot-y, 0px), var(--bv-slot-z, 0px)) scale(var(--bv-slot-scale, 1)) rotateY(var(--bv-slot-rot, 0deg))`,
                          transition: 'none',
                        }
                      : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCenter && !hasSwiped.current && Math.abs(currentDrag.current) < 25) {
                      setActiveIndex(index);
                    }
                  }}
                  onPointerUp={() => {
                    if (!isCenter && !hasSwiped.current && Math.abs(currentDrag.current) < 15) {
                      setActiveIndex(index);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${item.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIndex(index);
                    }
                  }}
                >
                  <div className="bv-video-card">
                    {/* Golden Backlight Glow for active center video */}
                    {isCenter && <div className="bv-card-glow" />}

                    {/* Video Frame */}
                    <div className="bv-card-frame">
                      {isPlaying && yId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${yId}?autoplay=1&rel=0`}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div
                          className="bv-card-cover"
                          onClick={() => {
                            if (isCenter && !hasSwiped.current && Math.abs(currentDrag.current) < 10) {
                              setPlayingIndex(index);
                            }
                          }}
                        >
                          {thumbUrl && (
                            <div
                              className="bv-thumb-img"
                              style={{
                                backgroundImage: `url(${thumbUrl})`,
                              }}
                            />
                          )}
                          <div className="bv-card-overlay" />
                          <div className="bv-vignette" />

                          {/* Play Button */}
                          <div className={`bv-play-btn ${isCenter ? 'bv-play-center' : ''}`}>
                            <div className="bv-play-core">
                              <Play s={isCenter ? 28 : 20} />
                            </div>
                          </div>

                          {/* Badge Label */}
                          <div className="bv-card-badges">
                            <span className="bv-type-badge">
                              {(item.type || 'VIDEO').toUpperCase()}
                            </span>
                            {!isCenter && (
                              <span className="bv-click-hint">
                                CLICK TO VIEW
                              </span>
                            )}
                          </div>

                          {/* Bottom Title Bar for non-center cards */}
                          {!isCenter && (
                            <div className="bv-bottom-title">
                              <span>{item.title}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Chevron Arrows */}
          <button
            type="button"
            className="cs-stage-arrow cs-arrow-prev bv-nav-arrow"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous video"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="cs-stage-arrow cs-arrow-next bv-nav-arrow"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next video"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Pagination Indicator Dots */}
        <div className="cs-pagination bv-pagination" aria-label="Video pagination">
          {validVideos.map((it, idx) => (
            <button
              key={it.id || idx}
              type="button"
              className={`cs-dot ${idx === safeIndex ? 'cs-dot-active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Switch to video ${idx + 1}: ${it.title}`}
            />
          ))}
        </div>

        {/* Read First Chapter Link */}
        {hasSample && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a href="#sample" className="book-video-scroll-hint">
              <span>READ THE FIRST CHAPTER</span>
              <Down />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
