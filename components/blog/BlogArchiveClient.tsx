'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/lib/types';

interface Props {
  posts: BlogPost[];
}

const CATEGORY_ICONS: Record<string, string> = {
  All: '✦',
  Featured: '★',
  'Behind the Book': '📖',
  'Historical Research': '🔍',
  'Writing Craft': '✒️',
  'Character Notes': '👤',
  'Frontier History': '🌄',
  'Author News': '📰',
};

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

  // Sync category with URL search param on mount (e.g., /blog?category=Behind+the+Book)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      if (catParam) {
        const matched = categories.find((c) => c.toLowerCase() === catParam.toLowerCase());
        if (matched) {
          setSelectedCategory(matched);
        }
      }
    }
  }, []);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (cat === 'All') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', cat);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return posts.length;
    if (cat === 'Featured') return posts.filter((p) => p.featured).length;
    return posts.filter((p) => p.category === cat).length;
  };

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
        className="blog-archive-filter-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
          borderBottom: '1px solid rgba(201, 168, 96, 0.15)',
          paddingBottom: 20,
        }}
      >
        {/* Category Filter Rail with FILTER Label */}
        <div
          className="blog-category-rail-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: '100%',
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
          {/* Filter Label */}
          <span
            style={{
              fontFamily: 'var(--serif-c, "Cinzel", serif)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>FILTER:</span>
          </span>

          {/* Category Pills with Horizontal Scroll on Mobile */}
          <div
            className="blog-category-pills-rail"
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              maxWidth: '100%',
              paddingBottom: 4,
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'center',
            }}
          >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = getCategoryCount(cat);
            const icon = CATEGORY_ICONS[cat] || '🏷️';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                style={{
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '7px 14px',
                  borderRadius: 24,
                  border: isSelected
                    ? '1px solid var(--gold)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(201, 168, 96, 0.22) 0%, rgba(201, 168, 96, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? 'var(--gold)' : 'var(--cream)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 0 14px rgba(201, 168, 96, 0.22)' : 'none',
                  transition: 'all 0.25s ease',
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                <span style={{ fontSize: 13, opacity: isSelected ? 1 : 0.8 }}>{icon}</span>
                <span>{cat}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(201, 168, 96, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#fff' : 'var(--muted)',
                    marginLeft: 2,
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
          </div>
        </div>

        {/* Right Controls: View Switcher (List vs Grid) + Search Bar */}
        <div
          className="blog-archive-controls"
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          {/* View Mode Switcher */}
          <div
            className="blog-viewmode-switcher"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '3px 4px',
              borderRadius: 20,
              border: '1px solid rgba(201, 168, 96, 0.25)',
              flexShrink: 0,
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

          {/* Search Bar (Full width on mobile) */}
          <div
            className="blog-search-box-wrap"
            style={{ position: 'relative', minWidth: 240, flex: '1 1 auto' }}
          >
            <input
              type="text"
              placeholder="Search articles & topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search-input"
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

      {/* Active Filter Indicator */}
      {(selectedCategory !== 'All' || searchQuery.trim()) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
            padding: '10px 16px',
            background: 'rgba(201, 168, 96, 0.06)',
            border: '1px solid rgba(201, 168, 96, 0.25)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--cream-2)', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--gold)' }}>Filtered by:</span>
            {selectedCategory !== 'All' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(201, 168, 96, 0.15)',
                  border: '1px solid rgba(201, 168, 96, 0.35)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  color: 'var(--gold)',
                  fontSize: 11,
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  letterSpacing: '0.08em',
                }}
              >
                {selectedCategory}
              </span>
            )}
            {searchQuery.trim() && (
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                matching &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>
              ({filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              handleCategorySelect('All');
              setSearchQuery('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gold)',
              fontSize: 11,
              fontFamily: 'var(--serif-c, "Cinzel", serif)',
              letterSpacing: '0.08em',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

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
                      KEN MERRELL · ARTICLE
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
                    className="blog-card-bottom-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 14,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      marginTop: 'auto',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                      className="blog-card-read-link"
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
                      <span>READ FULL ARTICLE</span>
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
