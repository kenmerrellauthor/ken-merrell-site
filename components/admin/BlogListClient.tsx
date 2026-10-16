'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ic } from '@/components/admin/AdIcons';
import type { BlogPost, Book, AdSettings } from '@/lib/types';
import { deleteBlogPostAction, saveBlogPostAction } from '@/app/admin/actions';
import AdsManagerClient from '@/components/admin/AdsManagerClient';

interface Props {
  initialBlogs: BlogPost[];
  books: Book[];
  adSettings?: AdSettings;
}

const COLS = '58px minmax(260px, 1.8fr) 150px 190px 100px 220px';

export default function BlogListClient({ initialBlogs, books, adSettings }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams?.get('tab') === 'ads' ? 'ads' : 'articles';
  const [view, setView] = useState<'articles' | 'ads'>(initialView);
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [tab, setTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    // Optimistic removal for instant UI response
    setBlogs((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      const res = await deleteBlogPostAction(id);
      if (!res.ok) {
        alert(res.error || 'Failed to delete blog post.');
        router.refresh();
      }
      setDeletingId(null);
    });
  };

  const handleTogglePublished = (post: BlogPost, forceTarget?: boolean) => {
    const nextStatus = typeof forceTarget === 'boolean' ? forceTarget : !post.isPublished;
    // Optimistic status update for instant click feedback
    setBlogs((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: nextStatus } : p)));
    setTogglingId(post.id);

    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', post.id);
      fd.set('title', post.title);
      fd.set('slug', post.slug);
      fd.set('excerpt', post.excerpt || '');
      fd.set('content', post.content || '');
      fd.set('category', post.category || 'Behind the Book');
      fd.set('coverImageUrl', post.coverImage || '');
      fd.set('authorName', post.authorName || 'Ken Merrell');
      fd.set('tags', (post.tags || []).join(', '));
      fd.set('readTimeMinutes', String(post.readTimeMinutes || 5));
      fd.set('isPublished', String(nextStatus));
      fd.set('featured', String(post.featured || false));
      fd.set('publishedAt', post.publishedAt || new Date().toISOString());
      fd.set('relatedBookSlug', post.relatedBookSlug || 'none');
      fd.set('metaTitle', post.metaTitle || post.title);
      fd.set('metaDescription', post.metaDescription || post.excerpt || '');
      fd.set('keyTakeaways', JSON.stringify(post.keyTakeaways || []));
      fd.set('faqItems', JSON.stringify(post.faqItems || []));

      const res = await saveBlogPostAction({}, fd);
      if (res.ok && res.post) {
        setBlogs((prev) => prev.map((p) => (p.id === post.id ? res.post! : p)));
      } else {
        // Rollback on failure
        setBlogs((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPublished: post.isPublished } : p)));
        alert(res.error || 'Failed to update article status.');
      }
      setTogglingId(null);
    });
  };

  const getBookTitle = (slug?: string | null) => {
    if (!slug) return null;
    return books.find((bk) => bk.slug === slug)?.title || slug;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Section Subtab Switcher: Articles vs Blog Ads ── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid rgba(201, 168, 96, 0.25)',
          paddingBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setView('articles')}
          style={{
            fontFamily: 'var(--serif-c, "Cinzel", serif)',
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '9px 20px',
            borderRadius: 5,
            border: view === 'articles' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
            background: view === 'articles' ? 'rgba(201, 168, 96, 0.16)' : 'rgba(255,255,255,0.02)',
            color: view === 'articles' ? 'var(--gold)' : 'var(--cream)',
            cursor: 'pointer',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <span>📝</span>
          <span>Articles &amp; Posts ({blogs.length})</span>
        </button>

        {adSettings && (
          <button
            type="button"
            onClick={() => setView('ads')}
            style={{
              fontFamily: 'var(--serif-c, "Cinzel", serif)',
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '9px 20px',
              borderRadius: 5,
              border: view === 'ads' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
              background: view === 'ads' ? 'rgba(201, 168, 96, 0.16)' : 'rgba(255,255,255,0.02)',
              color: view === 'ads' ? 'var(--gold)' : 'var(--cream)',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span>📢</span>
            <span>Blog Ads &amp; In-Article Banners</span>
          </button>
        )}
      </div>

      {view === 'ads' && adSettings ? (
        <AdsManagerClient initialSettings={adSettings} books={books} />
      ) : (
        <>
          {/* ── Tabs & Filter Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <nav className="crm-tabs" aria-label="Filter blog posts" style={{ margin: 0 }}>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={tab === 'all' ? 'on' : ''}
          >
            All posts ({blogs.length})
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
              className="crm-in"
              style={{ width: 'auto', height: 40, padding: '0 12px', fontSize: 13 }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-in"
              style={{ height: 40, paddingLeft: 34, fontSize: 13 }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
              <Ic k="search" s={14} />
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
                  background: 'none',
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

      {/* ── Native CRM Table ── */}
      <div className="crm-table" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="crm-tr head" style={{ gridTemplateColumns: COLS, minWidth: 1080 }}>
          <span>COVER</span>
          <span>ARTICLE</span>
          <span>CATEGORY</span>
          <span>SEO &amp; GEO STATUS</span>
          <span>STATUS</span>
          <span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ margin: 0, fontSize: 16, fontFamily: 'var(--serif-d)', color: 'var(--cream-2)' }}>No articles found.</p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              {search || categoryFilter !== 'all' ? 'Try adjusting your filters.' : 'Click "+ NEW ARTICLE" above to write your first post.'}
            </p>
          </div>
        ) : (
          filtered.map((post) => {
            const hasTakeaways = Boolean(post.keyTakeaways && post.keyTakeaways.length > 0);
            const hasFaqs = Boolean(post.faqItems && post.faqItems.length > 0);
            const bookTitle = getBookTitle(post.relatedBookSlug);
            const commentsCount = (post.comments || []).length;

            return (
              <div
                key={post.id}
                className="crm-tr row"
                style={{ gridTemplateColumns: COLS, minHeight: 96, padding: '16px 20px', minWidth: 1080 }}
              >
                {/* Cover Thumbnail */}
                <div style={{ width: 50, height: 72, borderRadius: 3, overflow: 'hidden', background: '#120f0d', boxShadow: '0 3px 10px rgba(0,0,0,.6)', position: 'relative', flexShrink: 0 }}>
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 9, letterSpacing: '.1em', background: 'rgba(201,168,96,.08)', textAlign: 'center', padding: 4, fontFamily: 'var(--serif-c)' }}>
                      KM POST
                    </div>
                  )}
                </div>

                {/* Article Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Link
                      href={`/admin/blogs/${post.slug || post.id}`}
                      prefetch={true}
                      className="crm-title"
                      style={{
                        fontSize: 17,
                        color: 'var(--cream-2)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                    {post.featured && (
                      <span className="pill gold" style={{ height: 20, fontSize: 9, padding: '0 6px', flexShrink: 0 }}>
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="crm-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
                    <span>{post.readTimeMinutes} min read</span>
                    <span>·</span>
                    <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>·</span>
                    <span
                      style={{
                        color: 'var(--muted)',
                        opacity: 0.7,
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}
                      title={`/blog/${post.slug}`}
                    >
                      /blog/{post.slug}
                    </span>
                    {post.views !== undefined && post.views > 0 && (
                      <>
                        <span>·</span>
                        <span style={{ color: 'var(--gold)' }}>{post.views.toLocaleString()} readers</span>
                      </>
                    )}
                    <span>·</span>
                    <Link
                      href={`/admin/blogs/${post.slug || post.id}#comments`}
                      style={{
                        color: commentsCount > 0 ? 'var(--gold)' : 'var(--muted)',
                        fontWeight: commentsCount > 0 ? 600 : 400,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title="View & moderate reader comments"
                    >
                      💬 {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                    </Link>
                  </div>
                </div>

                {/* Category */}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span
                    className="pill"
                    style={{
                      height: 26,
                      fontSize: 11,
                      padding: '0 10px',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      lineHeight: '24px',
                    }}
                    title={post.category || 'General'}
                  >
                    {post.category || 'General'}
                  </span>
                </div>

                {/* SEO & GEO status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      title="GEO Key Takeaways for ChatGPT, Perplexity & Claude"
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontWeight: 600,
                        background: hasTakeaways ? 'rgba(109,191,120,.12)' : 'rgba(255,255,255,.04)',
                        color: hasTakeaways ? '#6dbf78' : 'var(--muted)',
                        border: `1px solid ${hasTakeaways ? 'rgba(109,191,120,.3)' : 'rgba(255,255,255,.08)'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hasTakeaways ? `✓ ${post.keyTakeaways!.length} GEO Takeaways` : 'No takeaways'}
                    </span>
                    <span
                      title="FAQPage Schema for Google Rich Snippets"
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontWeight: 600,
                        background: hasFaqs ? 'rgba(109,191,120,.12)' : 'rgba(255,255,255,.04)',
                        color: hasFaqs ? '#6dbf78' : 'var(--muted)',
                        border: `1px solid ${hasFaqs ? 'rgba(109,191,120,.3)' : 'rgba(255,255,255,.08)'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hasFaqs ? `✓ ${post.faqItems!.length} FAQs` : 'No FAQs'}
                    </span>
                  </div>

                  {bookTitle && (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--gold)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 190,
                      }}
                      title={`Book: ${bookTitle}`}
                    >
                      📖 Book: {bookTitle}
                    </span>
                  )}
                </div>

                {/* Published Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <button
                    type="button"
                    role="switch"
                    className="switch"
                    aria-checked={post.isPublished}
                    onClick={() => handleTogglePublished(post)}
                    disabled={isPending && togglingId === post.id}
                    title={post.isPublished ? 'Click to make draft (unpublish)' : 'Click to publish live'}
                    style={{ opacity: isPending && togglingId === post.id ? 0.6 : 1 }}
                  >
                    <span />
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: post.isPublished ? '#6dbf78' : 'var(--gold)',
                      minWidth: 42,
                    }}
                  >
                    {isPending && togglingId === post.id ? '…' : post.isPublished ? 'Live' : 'Draft'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {post.isPublished ? (
                    <button
                      type="button"
                      onClick={() => handleTogglePublished(post, false)}
                      disabled={isPending && togglingId === post.id}
                      className="crm-sm"
                      style={{ height: 36, padding: '0 10px', fontSize: 11, borderColor: 'rgba(226,184,106,.4)', color: 'var(--gold)' }}
                      title="Save as draft (hide from public blog)"
                    >
                      <Ic k="file" s={13} /> Draft
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTogglePublished(post, true)}
                      disabled={isPending && togglingId === post.id}
                      className="crm-sm"
                      style={{ height: 36, padding: '0 10px', fontSize: 11, borderColor: 'rgba(109,191,120,.4)', color: '#6dbf78' }}
                      title="Publish article live to blog"
                    >
                      <Ic k="check" s={13} /> Publish
                    </button>
                  )}
                  {post.isPublished && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="crm-sm icon"
                      title="View live article"
                    >
                      <Ic k="ext" s={14} />
                    </a>
                  )}
                  <Link
                    href={`/admin/blogs/${post.slug || post.id}`}
                    prefetch={true}
                    className="crm-sm"
                    style={{ height: 36, padding: '0 12px', fontSize: 12 }}
                  >
                    <Ic k="edit" s={13} /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={isPending && deletingId === post.id}
                    className="crm-sm danger icon"
                    style={{ height: 36, width: 36 }}
                    title="Delete article"
                  >
                    {isPending && deletingId === post.id ? '…' : <Ic k="trash" s={14} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
}
