'use client';

import Link from 'next/link';
import type { BlogPost } from '@/lib/types';

interface MoreArticlesProps {
  posts: BlogPost[];
  currentCategory?: string;
}

export default function MoreArticlesSection({ posts, currentCategory }: MoreArticlesProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section
      aria-label="More Articles"
      style={{
        marginTop: 56,
        paddingTop: 48,
        borderTop: '1px solid rgba(201, 168, 96, 0.25)',
      }}
    >
      {/* Section Header */}
      <div style={{ marginBottom: 28, textAlign: 'left' }}>
        <div
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--gold)', opacity: 0.7 }} />
          <span>MORE DISPATCHES & ESSAYS</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <h2
            style={{
              fontFamily: 'var(--serif, Georgia, serif)',
              fontSize: 'clamp(22px, 3vw, 28px)',
              color: 'var(--cream)',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {currentCategory ? `More in ${currentCategory} & Beyond` : 'More from the Frontier Archives'}
          </h2>

          <Link
            href="/blog"
            style={{
              fontFamily: 'var(--serif-c, "Cinzel", serif)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'opacity 0.2s ease',
            }}
            className="hover-gold-link"
          >
            <span>View All Articles</span>
            <span style={{ fontSize: 13 }}>→</span>
          </Link>
        </div>
      </div>

      {/* Grid of More Articles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {posts.map((post) => (
          <article
            key={post.id}
            className="blog-card"
            style={{
              background: 'linear-gradient(180deg, rgba(28, 23, 18, 0.7) 0%, rgba(14, 12, 10, 0.9) 100%)',
              border: post.featured ? '1px solid rgba(201, 168, 96, 0.45)' : '1px solid rgba(201, 168, 96, 0.2)',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <Link
              href={`/blog/${post.slug}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              {/* Cover Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  overflow: 'hidden',
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
                      display: 'block',
                      transition: 'transform 0.5s ease',
                    }}
                    className="blog-card-img"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'radial-gradient(circle, #2a2219 0%, #120f0c 100%)',
                      color: 'var(--gold)',
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      letterSpacing: '0.1em',
                      fontSize: 11,
                    }}
                  >
                    KEN MERRELL · ESSAY
                  </div>
                )}

                {/* Category Pill */}
                {post.category && (
                  <span
                    className="blog-card-badge"
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(10, 9, 8, 0.88)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(201, 168, 96, 0.4)',
                      color: 'var(--gold)',
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 3,
                    }}
                  >
                    {post.category}
                  </span>
                )}

                {post.featured && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(201, 168, 96, 0.95)',
                      color: '#15120f',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}
                  >
                    ★ FEATURED
                  </span>
                )}
              </div>

              {/* Text Body */}
              <div
                style={{
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: 'var(--muted)',
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>
                    {new Date(post.publishedAt || post.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{post.readTimeMinutes || 4} min read</span>
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.35,
                    color: 'var(--cream)',
                    fontFamily: 'var(--serif, Georgia, serif)',
                    fontWeight: 600,
                    transition: 'color 0.2s ease',
                  }}
                  className="blog-card-title"
                >
                  {post.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: '#b8ad9e',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  {post.excerpt}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 10,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      color: 'var(--gold)',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Read Article</span>
                    <span className="blog-card-arrow">→</span>
                  </span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
