'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/lib/types';

interface Props {
  posts: BlogPost[];
}

export default function BlogFeaturedSpotlight({ posts }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = posts.length;
  const currentPost = posts[currentIndex] || posts[0];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Optional auto-rotate every 8s if multiple posts and not hovered
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
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

  if (!currentPost) return null;

  return (
    <section
      style={{
        paddingLeft: 'var(--pad)',
        paddingRight: 'var(--pad)',
        paddingBottom: 40,
        maxWidth: 1200,
        margin: '0 auto',
      }}
      aria-label="Featured Articles Spotlight"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Multi-Featured Navigation Header (when 2 or more articles are featured) */}
      {total > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            padding: '10px 16px',
            background: 'rgba(28, 23, 18, 0.75)',
            border: '1px solid rgba(201, 168, 96, 0.25)',
            borderRadius: 6,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: 'rgba(201, 168, 96, 0.2)',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                fontSize: 10,
                letterSpacing: '0.12em',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 3,
                textTransform: 'uppercase',
              }}
            >
              ★ {total} FEATURED ARTICLES
            </span>
            <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>
              Viewing {currentIndex + 1} of {total}
            </span>
          </div>

          {/* Quick tab switcher for all featured articles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {posts.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  background: currentIndex === idx ? 'var(--gold)' : 'rgba(255, 255, 255, 0.05)',
                  color: currentIndex === idx ? '#15120f' : 'var(--cream)',
                  border: currentIndex === idx ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
                title={p.title}
              >
                {idx + 1}. {p.title}
              </button>
            ))}

            <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous featured article"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,96,0.3)',
                  color: 'var(--cream)',
                  borderRadius: 3,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next featured article"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,168,96,0.3)',
                  color: 'var(--cream)',
                  borderRadius: 3,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Spotlight Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.95) 0%, rgba(14, 12, 10, 0.98) 100%)',
          border: '1px solid rgba(201, 168, 96, 0.35)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
          }}
        >
          {/* Cover Image */}
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 320, background: '#1c1712' }}>
            {currentPost.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={currentPost.id}
                src={currentPost.coverImage}
                alt={currentPost.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  inset: 0,
                  transition: 'opacity 0.4s ease',
                }}
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
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                background: 'rgba(201, 168, 96, 0.25)',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                fontSize: 11,
                letterSpacing: '0.12em',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 4,
                textTransform: 'uppercase',
                backdropFilter: 'blur(4px)',
              }}
            >
              ★ FEATURED ARTICLE
            </span>

            {total > 1 && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 20,
                  background: 'rgba(10, 9, 8, 0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--muted)',
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 3,
                }}
              >
                Story {currentIndex + 1} of {total}
              </span>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <span>{currentPost.category}</span>
              <span>•</span>
              <span style={{ color: 'var(--muted)' }}>{currentPost.readTimeMinutes} min read</span>
              <span>•</span>
              <span style={{ color: 'var(--muted)' }}>
                {new Date(currentPost.publishedAt || currentPost.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(24px, 2.5vw, 32px)',
                color: 'var(--cream)',
                lineHeight: 1.25,
              }}
            >
              <Link href={`/blog/${currentPost.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {currentPost.title}
              </Link>
            </h2>

            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#c4b8a5' }}>
              {currentPost.excerpt}
            </p>

            {/* Highlights */}
            {currentPost.keyTakeaways && currentPost.keyTakeaways.length > 0 && (
              <div style={{ padding: '10px 14px', background: 'rgba(201, 168, 96, 0.08)', borderLeft: '3px solid var(--gold)', borderRadius: 3, fontSize: 12, color: '#ded3c1' }}>
                <b style={{ color: 'var(--gold)' }}>Key Insight:</b> {currentPost.keyTakeaways[0]}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, flexWrap: 'wrap', gap: 12 }}>
              <Link
                href={`/blog/${currentPost.slug}`}
                className="btn pri"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: 12,
                  letterSpacing: '0.12em',
                }}
              >
                READ FULL ESSAY →
              </Link>

              {/* Pagination Dots */}
              {total > 1 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {posts.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      aria-label={`Go to featured article ${i + 1}`}
                      style={{
                        width: currentIndex === i ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: currentIndex === i ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
