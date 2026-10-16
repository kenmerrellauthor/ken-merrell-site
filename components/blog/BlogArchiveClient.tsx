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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const hasFeatured = posts.some((p) => p.featured);
  const categories = [
    'All',
    ...(hasFeatured ? ['Featured'] : []),
    ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean))),
  ];

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === 'Featured') {
      if (!p.featured) return false;
    } else if (selectedCategory !== 'All' && p.category !== selectedCategory) {
      return false;
    }
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
      {/* Category Pills, View Mode & Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 36,
          borderBottom: '1px solid rgba(201, 168, 96, 0.15)',
          paddingBottom: 20,
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
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
                padding: '7px 15px',
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

        {/* Right Controls: View Switcher (List vs Grid) + Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '3px 4px',
              borderRadius: 20,
              border: '1px solid rgba(201, 168, 96, 0.25)',
            }}
            aria-label="Article layout view mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List View"
              style={{
                background: viewMode === 'list' ? 'rgba(201, 168, 96, 0.2)' : 'transparent',
                color: viewMode === 'list' ? 'var(--gold)' : 'var(--muted)',
                border: viewMode === 'list' ? '1px solid rgba(201, 168, 96, 0.45)' : '1px solid transparent',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
                fontWeight: viewMode === 'list' ? 700 : 500,
              }}
            >
              <span>☰</span>
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              style={{
                background: viewMode === 'grid' ? 'rgba(201, 168, 96, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--gold)' : 'var(--muted)',
                border: viewMode === 'grid' ? '1px solid rgba(201, 168, 96, 0.45)' : '1px solid transparent',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: 'var(--serif-c, "Cinzel", serif)',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
                fontWeight: viewMode === 'grid' ? 700 : 500,
              }}
            >
              <span>☵</span>
              <span>Grid</span>
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: 240 }}>
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
                padding: '7px 14px 7px 34px',
                color: 'var(--cream)',
                fontSize: 12.5,
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.5,
                fontSize: 12,
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
      </div>

      {/* Posts List or Grid */}
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
            display: viewMode === 'list' ? 'flex' : 'grid',
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : undefined,
            gap: viewMode === 'list' ? 24 : 32,
          }}
        >
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className={`blog-card ${viewMode === 'list' ? 'blog-card-list-mode' : ''}`}
              style={{
                background: 'linear-gradient(180deg, rgba(28, 23, 18, 0.6) 0%, rgba(14, 12, 10, 0.8) 100%)',
                border: post.featured ? '1px solid rgba(201, 168, 96, 0.5)' : '1px solid rgba(201, 168, 96, 0.18)',
                boxShadow: post.featured ? '0 8px 24px rgba(201, 168, 96, 0.1)' : undefined,
                borderRadius: 8,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className={viewMode === 'list' ? 'blog-card-list-link' : undefined}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: viewMode === 'list' ? 'row' : 'column',
                  height: '100%',
                }}
              >
                {/* Cover Image */}
                <div
                  className={viewMode === 'list' ? 'blog-card-list-cover' : undefined}
                  style={{
                    position: 'relative',
                    width: viewMode === 'list' ? undefined : '100%',
                    aspectRatio: viewMode === 'list' ? undefined : '16/9',
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
                        transition: 'transform 0.5s ease',
                        display: 'block',
                      }}
                      className="blog-card-img"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 180,
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
                    className="blog-card-badge"
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

                  {/* Featured Badge on image */}
                  {post.featured && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(201, 168, 96, 0.95)',
                        color: '#15120f',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      ★ FEATURED
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div
                  className={viewMode === 'list' ? 'blog-card-list-body' : undefined}
                  style={{
                    padding: viewMode === 'list' ? '26px 28px' : '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                    <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{post.readTimeMinutes} min read</span>
                    {viewMode === 'list' && post.category && (
                      <>
                        <span>•</span>
                        <span style={{ color: 'var(--gold)' }}>{post.category}</span>
                      </>
                    )}
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: viewMode === 'list' ? 'clamp(20px, 2.2vw, 24px)' : 19,
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
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: '#b8ad9e',
                      display: '-webkit-box',
                      WebkitLineClamp: viewMode === 'list' ? 3 : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>

                  {/* Highlights (Takeaways / FAQs pill & Action) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 14,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      marginTop: 'auto',
                    }}
                  >
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
                          Q&amp;A
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>READ ESSAY</span>
                      <span className="blog-card-arrow">→</span>
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
