'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/lib/types';

interface Props {
  posts: BlogPost[];
}

export default function BlogFeaturedSpotlight({ posts }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const total = posts.length;
  const SLIDE_DURATION = 6000; // 6 seconds auto-swipe

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  // Auto-swipe timer with smooth visual progress bar
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const intervalStep = 50;
    const stepIncrement = (intervalStep / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (total <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [total, handleNext, handlePrev]);

  // Touch Swipe Handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 45) {
        handleNext(); // Swiped Left -> go Next
      } else if (diff < -45) {
        handlePrev(); // Swiped Right -> go Prev
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsPaused(false);
  };

  // Mouse Drag Swipe Handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingRef.current && mouseStartXRef.current !== null) {
      const diff = mouseStartXRef.current - e.clientX;
      if (diff > 50) {
        handleNext();
      } else if (diff < -50) {
        handlePrev();
      }
    }
    mouseStartXRef.current = null;
    isDraggingRef.current = false;
  };

  if (!posts || posts.length === 0) return null;

  return (
    <section
      style={{
        paddingLeft: 'var(--pad)',
        paddingRight: 'var(--pad)',
        paddingBottom: 40,
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
      }}
      aria-label="Featured Articles Spotlight Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Slider Frame with Rounded Border & Luxury Gold Trim */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.96) 0%, rgba(14, 12, 10, 0.98) 100%)',
          border: '1px solid rgba(201, 168, 96, 0.35)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(201, 168, 96, 0.15)',
          position: 'relative',
          userSelect: 'none',
          cursor: total > 1 ? 'grab' : 'default',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Decorative Vintage Gold Corner Accents */}
        <span style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '2px solid var(--gold, #c9a860)', borderLeft: '2px solid var(--gold, #c9a860)', zIndex: 12 }} />
        <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '2px solid var(--gold, #c9a860)', borderRight: '2px solid var(--gold, #c9a860)', zIndex: 12 }} />
        <span style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '2px solid var(--gold, #c9a860)', borderLeft: '2px solid var(--gold, #c9a860)', zIndex: 12 }} />
        <span style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '2px solid var(--gold, #c9a860)', borderRight: '2px solid var(--gold, #c9a860)', zIndex: 12 }} />

        {/* Sliding Track for All Featured Articles */}
        <div
          style={{
            display: 'flex',
            width: `${total * 100}%`,
            transform: `translateX(-${(currentIndex * 100) / total}%)`,
            transition: 'transform 0.55s cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
        >
          {posts.map((post, idx) => (
            <div
              key={post.id}
              style={{
                width: `${100 / total}%`,
                flexShrink: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                alignItems: 'stretch',
              }}
            >
              {/* Cover Image Column */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 340,
                  background: '#1c1712',
                }}
              >
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      inset: 0,
                    }}
                    draggable={false}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold)',
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      letterSpacing: '0.12em',
                      fontSize: 14,
                      background: 'radial-gradient(circle, #2a2219 0%, #120f0c 100%)',
                    }}
                  >
                    KEN MERRELL · FEATURED
                  </div>
                )}

                {/* Subtle vignette shade for high contrast readability */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)',
                  }}
                />

                {/* Top Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(28, 23, 18, 0.85)',
                      border: '1px solid var(--gold)',
                      color: 'var(--gold)',
                      fontSize: 10.5,
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    ★ FEATURED ARTICLE
                  </span>
                  {total > 1 && (
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'var(--cream)',
                        fontSize: 10,
                        padding: '4px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {idx + 1} / {total}
                    </span>
                  )}
                </div>
              </div>

              {/* Content Column */}
              <div
                style={{
                  padding: '40px 36px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  justifyContent: 'center',
                  background: 'rgba(20, 16, 12, 0.65)',
                }}
              >
                {/* Meta details */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 12,
                    color: 'var(--gold)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{post.category}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--muted)' }}>{post.readTimeMinutes} min read</span>
                  <span>•</span>
                  <span style={{ color: 'var(--muted)' }}>
                    {new Date(post.publishedAt || post.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Article Title */}
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--serif, Georgia, serif)',
                    fontSize: 'clamp(24px, 2.6vw, 34px)',
                    color: 'var(--cream)',
                    lineHeight: 1.22,
                    fontWeight: 700,
                  }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: '#ded3c1',
                  }}
                >
                  {post.excerpt}
                </p>

                {/* Highlights / Key Insight */}
                {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(201, 168, 96, 0.08)',
                      borderLeft: '3px solid var(--gold)',
                      borderRadius: 3,
                      fontSize: 12.5,
                      color: '#eae2d5',
                      lineHeight: 1.5,
                    }}
                  >
                    <b style={{ color: 'var(--gold)' }}>Key Insight:</b> {post.keyTakeaways[0]}
                  </div>
                )}

                {/* CTA Action & Slide Indicators */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="btn pri"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 24px',
                      fontSize: 11.5,
                      letterSpacing: '0.12em',
                    }}
                  >
                    READ FULL ESSAY →
                  </Link>

                  {/* Dot Indicators */}
                  {total > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        background: 'rgba(0, 0, 0, 0.45)',
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: '1px solid rgba(201, 168, 96, 0.2)',
                      }}
                    >
                      {posts.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => goToSlide(i)}
                          aria-label={`Go to featured article ${i + 1}`}
                          style={{
                            width: currentIndex === i ? 26 : 8,
                            height: 8,
                            borderRadius: 4,
                            background: currentIndex === i ? 'var(--gold, #c9a860)' : 'rgba(255,255,255,0.25)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Manual Navigation Chevrons (Left & Right) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous article slide"
              style={{
                position: 'absolute',
                top: '50%',
                left: 14,
                transform: 'translateY(-50%)',
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'rgba(18, 14, 10, 0.85)',
                border: '1px solid rgba(201, 168, 96, 0.4)',
                color: 'var(--gold, #c9a860)',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#15120f';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(18, 14, 10, 0.85)';
                e.currentTarget.style.color = 'var(--gold, #c9a860)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next article slide"
              style={{
                position: 'absolute',
                top: '50%',
                right: 14,
                transform: 'translateY(-50%)',
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'rgba(18, 14, 10, 0.85)',
                border: '1px solid rgba(201, 168, 96, 0.4)',
                color: 'var(--gold, #c9a860)',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#15120f';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(18, 14, 10, 0.85)';
                e.currentTarget.style.color = 'var(--gold, #c9a860)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Animated Auto-Swipe Progress Bar at the very bottom */}
        {total > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 3,
              background: 'rgba(255, 255, 255, 0.08)',
              zIndex: 11,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--gold, #c9a860), #f4deb3)',
                boxShadow: '0 0 8px rgba(201, 168, 96, 0.7)',
                transition: isPaused ? 'none' : 'width 0.05s linear',
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
