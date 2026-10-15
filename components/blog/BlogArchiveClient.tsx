'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/lib/types';

interface Props {
  posts: BlogPost[];
}

export default function BlogArchiveClient({ posts }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchExcerpt = (p.excerpt || '').toLowerCase().includes(q);
      const matchTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchTags) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Category Pills & Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 40,
          borderBottom: '1px solid rgba(201, 168, 96, 0.15)',
          paddingBottom: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                borderRadius: 20,
                border: selectedCategory === cat ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                background: selectedCategory === cat ? 'rgba(201, 168, 96, 0.15)' : 'rgba(255,255,255,0.02)',
                color: selectedCategory === cat ? 'var(--gold)' : 'var(--cream)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search articles & topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '8px 16px 8px 36px',
              color: 'var(--cream)',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.5,
              fontSize: 13,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Posts */}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <p style={{ fontSize: 18, fontFamily: 'var(--serif, Georgia, serif)', margin: '0 0 8px', color: 'var(--cream)' }}>
            No articles found matching your criteria.
          </p>
          <p style={{ fontSize: 14 }}>Try selecting a different category or clearing your search query.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 32,
          }}
        >
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="blog-card"
              style={{
                background: 'linear-gradient(180deg, rgba(28, 23, 18, 0.6) 0%, rgba(14, 12, 10, 0.8) 100%)',
                border: '1px solid rgba(201, 168, 96, 0.18)',
                borderRadius: 8,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Cover Image */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#1c1712' }}>
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
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
                        fontSize: 12,
                      }}
                    >
                      KEN MERRELL · ESSAY
                    </div>
                  )}

                  {/* Category Badge on image */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: 'rgba(10, 9, 8, 0.85)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(201, 168, 96, 0.4)',
                      color: 'var(--gold)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 3,
                    }}
                  >
                    {post.category || 'Article'}
                  </span>
                </div>

                {/* Card Content */}
                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                    <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{post.readTimeMinutes} min read</span>
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 19,
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
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: '#b8ad9e',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>

                  {/* Highlights (Takeaways / FAQs pill) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--gold)',
                            background: 'rgba(201,168,96,0.1)',
                            padding: '2px 6px',
                            borderRadius: 3,
                            border: '1px solid rgba(201,168,96,0.2)',
                          }}
                        >
                          ⚡ Key Takeaways
                        </span>
                      )}
                      {post.faqItems && post.faqItems.length > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#5cdb95',
                            background: 'rgba(92,219,149,0.08)',
                            padding: '2px 6px',
                            borderRadius: 3,
                            border: '1px solid rgba(92,219,149,0.2)',
                          }}
                        >
                          Q&A
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--gold)',
                        letterSpacing: '0.1em',
                        fontFamily: 'var(--serif-c, "Cinzel", serif)',
                        fontWeight: 600,
                      }}
                    >
                      READ ESSAY →
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
