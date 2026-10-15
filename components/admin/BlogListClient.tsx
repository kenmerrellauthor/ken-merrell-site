'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ic } from '@/components/admin/AdIcons';
import type { BlogPost, Book } from '@/lib/types';
import { deleteBlogPostAction } from '@/app/admin/actions';

interface Props {
  initialBlogs: BlogPost[];
  books: Book[];
}

export default function BlogListClient({ initialBlogs, books }: Props) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [tab, setTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)));

  const filtered = blogs.filter((b) => {
    if (tab === 'published' && !b.isPublished) return false;
    if (tab === 'drafts' && b.isPublished) return false;
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchExcerpt = (b.excerpt || '').toLowerCase().includes(q);
      const matchTags = (b.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchTags) return false;
    }
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteBlogPostAction(id);
      if (res.ok) {
        setBlogs((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete blog post.');
      }
      setDeletingId(null);
    });
  };

  const getBookTitle = (slug?: string | null) => {
    if (!slug) return null;
    return books.find((bk) => bk.slug === slug)?.title || slug;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <nav className="crm-tabs" aria-label="Filter blog posts" style={{ margin: 0 }}>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={tab === 'all' ? 'on' : ''}
          >
            All Posts ({blogs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('published')}
            className={tab === 'published' ? 'on' : ''}
          >
            Published ({blogs.filter((b) => b.isPublished).length})
          </button>
          <button
            type="button"
            onClick={() => setTab('drafts')}
            className={tab === 'drafts' ? 'on' : ''}
          >
            Drafts ({blogs.filter((b) => !b.isPublished).length})
          </button>
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="crm-select"
              style={{
                background: 'var(--panel)',
                color: 'var(--cream)',
                border: '1px solid var(--line)',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative', minWidth: 240 }}>
            <input
              type="text"
              placeholder="Search by title, tag, content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input"
              style={{
                paddingLeft: 34,
                fontSize: 13,
                paddingTop: 8,
                paddingBottom: 8,
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
              <Ic k="search" s={15} />
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Blog Posts List */}
      <div className="crm-table" style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
        <div
          className="crm-tr head"
          style={{
            display: 'grid',
            gridTemplateColumns: '80px minmax(280px, 1fr) 140px 180px 110px 180px',
            alignItems: 'center',
            padding: '12px 18px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--line)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            fontWeight: 700,
          }}
        >
          <span>COVER</span>
          <span>ARTICLE TITLE & SUMMARY</span>
          <span>CATEGORY</span>
          <span>SEO & GEO ENHANCEMENTS</span>
          <span>VIEWS</span>
          <span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ margin: 0, fontSize: 15 }}>No blog posts match your criteria.</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.7 }}>
              {search || categoryFilter !== 'all' ? 'Try adjusting your search filters or clearing the search box.' : 'Create your first article to start ranking on Google and AI search engines.'}
            </p>
          </div>
        ) : (
          filtered.map((post) => {
            const hasTakeaways = Boolean(post.keyTakeaways && post.keyTakeaways.length > 0);
            const hasFaqs = Boolean(post.faqItems && post.faqItems.length > 0);
            const bookTitle = getBookTitle(post.relatedBookSlug);

            return (
              <div
                key={post.id}
                className="crm-tr row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px minmax(280px, 1fr) 140px 180px 110px 180px',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  gap: 12,
                }}
              >
                {/* Cover Image Thumb */}
                <div>
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      style={{
                        width: 64,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 4,
                        border: '1px solid var(--line)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 48,
                        borderRadius: 4,
                        background: 'rgba(201,168,96,0.08)',
                        border: '1px dashed rgba(201,168,96,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold)',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                      }}
                    >
                      NO COVER
                    </div>
                  )}
                </div>

                {/* Title & Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link
                      href={`/admin/blogs/${post.id}`}
                      style={{
                        color: 'var(--cream)',
                        fontWeight: 600,
                        fontSize: 15,
                        textDecoration: 'none',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {post.title}
                    </Link>
                    {post.featured && (
                      <span
                        style={{
                          background: 'rgba(201,168,96,0.18)',
                          color: '#e2b86a',
                          border: '1px solid rgba(201,168,96,0.4)',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 3,
                          letterSpacing: '0.06em',
                        }}
                      >
                        FEATURED
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontWeight: 600,
                        background: post.isPublished ? 'rgba(74, 189, 134, 0.15)' : 'rgba(255, 170, 0, 0.12)',
                        color: post.isPublished ? '#5cdb95' : '#ffb74d',
                        border: `1px solid ${post.isPublished ? 'rgba(74, 189, 134, 0.3)' : 'rgba(255, 170, 0, 0.25)'}`,
                      }}
                    >
                      {post.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'var(--muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                    }}
                  >
                    {post.excerpt || 'No excerpt written yet.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#888' }}>
                    <span>{post.readTimeMinutes} min read</span>
                    <span>•</span>
                    <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>/blog/{post.slug}</span>
                  </div>
                </div>

                {/* Category & Tags */}
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      color: 'var(--cream)',
                    }}
                  >
                    {post.category || 'General'}
                  </span>
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
                      #{post.tags.slice(0, 2).join(' #')}
                      {post.tags.length > 2 ? ` +${post.tags.length - 2}` : ''}
                    </div>
                  )}
                </div>

                {/* SEO & GEO Enhancements */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span
                      title="Generative Engine Optimization: Key Takeaways block for AI summaries"
                      style={{
                        fontSize: 10,
                        padding: '2px 5px',
                        borderRadius: 3,
                        fontWeight: 600,
                        background: hasTakeaways ? 'rgba(92, 219, 149, 0.12)' : 'rgba(255,255,255,0.04)',
                        color: hasTakeaways ? '#5cdb95' : 'var(--muted)',
                        border: `1px solid ${hasTakeaways ? 'rgba(92, 219, 149, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {hasTakeaways ? `✓ ${post.keyTakeaways!.length} GEO Takeaways` : 'No Takeaways'}
                    </span>
                    <span
                      title="FAQPage Schema for Google Rich Snippets & ChatGPT direct answers"
                      style={{
                        fontSize: 10,
                        padding: '2px 5px',
                        borderRadius: 3,
                        fontWeight: 600,
                        background: hasFaqs ? 'rgba(92, 219, 149, 0.12)' : 'rgba(255,255,255,0.04)',
                        color: hasFaqs ? '#5cdb95' : 'var(--muted)',
                        border: `1px solid ${hasFaqs ? 'rgba(92, 219, 149, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {hasFaqs ? `✓ ${post.faqItems!.length} FAQs` : 'No FAQs'}
                    </span>
                  </div>

                  {bookTitle && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={`Promotes book: ${bookTitle}`}
                    >
                      📖 CTA: {bookTitle}
                    </span>
                  )}
                </div>

                {/* Views */}
                <div>
                  <b style={{ fontSize: 14, color: 'var(--cream)' }}>{(post.views || 0).toLocaleString()}</b>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>readers</div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                  {post.isPublished && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="crm-btn sec"
                      style={{ padding: '6px 10px', fontSize: 11 }}
                      title="View public article"
                    >
                      <Ic k="link" s={13} />VIEW
                    </Link>
                  )}
                  <Link
                    href={`/admin/blogs/${post.id}`}
                    className="crm-btn pri"
                    style={{ padding: '6px 10px', fontSize: 11 }}
                  >
                    <Ic k="edit" s={13} />EDIT
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={isPending && deletingId === post.id}
                    className="crm-btn del"
                    style={{
                      padding: '6px 8px',
                      fontSize: 11,
                      background: 'transparent',
                      border: '1px solid rgba(229, 138, 120, 0.3)',
                      color: '#e58a78',
                    }}
                    title="Delete article"
                  >
                    {isPending && deletingId === post.id ? '…' : <Ic k="trash" s={13} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
