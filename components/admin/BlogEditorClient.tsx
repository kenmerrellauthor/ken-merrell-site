'use client';

import { useState, useTransition, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ic } from '@/components/admin/AdIcons';
import type { BlogPost, Book, BlogFAQItem } from '@/lib/types';
import { saveBlogPostAction, deleteBlogPostAction } from '@/app/admin/actions';

interface Props {
  initialBlog: BlogPost;
  isNew: boolean;
  books: Book[];
}

const CATEGORY_PRESETS = [
  'Behind the Book',
  'Historical Research',
  'Writing Craft',
  'Character Notes',
  'Frontier History',
  'Author News',
];

export default function BlogEditorClient({ initialBlog, isNew, books }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Core fields
  const [title, setTitle] = useState(initialBlog.title || '');
  const [slug, setSlug] = useState(initialBlog.slug || '');
  const [category, setCategory] = useState(initialBlog.category || 'Behind the Book');
  const [customCategory, setCustomCategory] = useState('');
  const [excerpt, setExcerpt] = useState(initialBlog.excerpt || '');
  const [content, setContent] = useState(initialBlog.content || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialBlog.coverImage || '');
  const [authorName, setAuthorName] = useState(initialBlog.authorName || 'Ken Merrell');
  const [tags, setTags] = useState((initialBlog.tags || []).join(', '));
  const [isPublished, setIsPublished] = useState(initialBlog.isPublished ?? true);
  const [featured, setFeatured] = useState(initialBlog.featured ?? false);
  const [publishedAt, setPublishedAt] = useState(
    initialBlog.publishedAt ? initialBlog.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [relatedBookSlug, setRelatedBookSlug] = useState(initialBlog.relatedBookSlug || '');

  // SEO & GEO fields
  const [metaTitle, setMetaTitle] = useState(initialBlog.metaTitle || initialBlog.title || '');
  const [metaDescription, setMetaDescription] = useState(initialBlog.metaDescription || initialBlog.excerpt || '');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialBlog.keyTakeaways && initialBlog.keyTakeaways.length > 0
      ? initialBlog.keyTakeaways
      : ['']
  );
  const [faqItems, setFaqItems] = useState<BlogFAQItem[]>(
    initialBlog.faqItems && initialBlog.faqItems.length > 0
      ? initialBlog.faqItems
      : [{ question: '', answer: '' }]
  );

  // Tab mode in editor
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Read time & word count
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const autoReadTime = Math.max(1, Math.ceil(words / 200));

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  };

  const handleGenerateSlug = () => {
    if (!title) return;
    setSlug(slugify(title));
  };

  // Quick insertion helpers for editor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('blog-content-area') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const sel = content.substring(start, end) || 'text';
    const replacement = `${prefix}${sel}${suffix}`;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(nextContent);
  };

  // Key Takeaways management
  const updateTakeaway = (idx: number, val: string) => {
    const copy = [...keyTakeaways];
    copy[idx] = val;
    setKeyTakeaways(copy);
  };
  const addTakeaway = () => setKeyTakeaways([...keyTakeaways, '']);
  const removeTakeaway = (idx: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx));
  };

  // FAQ management
  const updateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    const copy = [...faqItems];
    copy[idx] = { ...copy[idx], [field]: val };
    setFaqItems(copy);
  };
  const addFaq = () => setFaqItems([...faqItems, { question: '', answer: '' }]);
  const removeFaq = (idx: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== idx));
  };

  // Submit
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!title.trim()) {
      setStatusMessage({ type: 'err', text: 'Please provide an article title.' });
      return;
    }

    const finalSlug = slug.trim() ? slugify(slug) : slugify(title);
    const finalCategory = customCategory.trim() || category;

    const formData = new FormData();
    formData.set('id', initialBlog.id || '');
    formData.set('title', title.trim());
    formData.set('slug', finalSlug);
    formData.set('excerpt', excerpt.trim());
    formData.set('content', content);
    formData.set('category', finalCategory);
    formData.set('coverImageUrl', coverImageUrl.trim());
    formData.set('authorName', authorName.trim() || 'Ken Merrell');
    formData.set('tags', tags);
    formData.set('readTimeMinutes', String(autoReadTime));
    formData.set('isPublished', String(isPublished));
    formData.set('featured', String(featured));
    formData.set('publishedAt', new Date(publishedAt).toISOString());
    formData.set('relatedBookSlug', relatedBookSlug || 'none');
    formData.set('metaTitle', (metaTitle.trim() || title.trim()));
    formData.set('metaDescription', (metaDescription.trim() || excerpt.trim()));
    formData.set('keyTakeaways', JSON.stringify(keyTakeaways.filter((t) => t.trim())));
    formData.set('faqItems', JSON.stringify(faqItems.filter((f) => f.question.trim() && f.answer.trim())));

    // Check if cover file was uploaded
    const coverFileInput = document.getElementById('blog-cover-file') as HTMLInputElement | null;
    if (coverFileInput?.files?.[0]) {
      formData.set('coverImageFile', coverFileInput.files[0]);
    }

    startTransition(async () => {
      const res = await saveBlogPostAction({}, formData);
      if (res.ok) {
        setStatusMessage({ type: 'ok', text: 'Article saved successfully!' });
        if (isNew && res.id) {
          router.push(`/admin/blogs/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        setStatusMessage({ type: 'err', text: res.error || 'Failed to save blog post.' });
      }
    });
  };

  const selectedBook = books.find((b) => b.slug === relatedBookSlug);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header bar */}
      <div className="crm-top" style={{ alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/admin/blogs" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
              ← Back to Blog Posts
            </Link>
            <span style={{ color: 'var(--line)' }}>/</span>
            <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>
              {isNew ? 'New Article' : 'Edit Article'}
            </span>
          </div>
          <h1 style={{ margin: 0 }}>{title.trim() ? title : 'Untitled Article'}</h1>
        </div>

        <div className="crm-actions" style={{ alignItems: 'center', gap: 10 }}>
          {!isNew && isPublished && slug && (
            <Link href={`/blog/${slug}`} target="_blank" className="crm-btn sec" style={{ fontSize: 12 }}>
              <Ic k="link" s={14} />VIEW LIVE
            </Link>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isPending}
            className="crm-btn pri"
            style={{ fontSize: 13, padding: '10px 20px' }}
          >
            <Ic k="check" s={16} sw={1.8} />
            {isPending ? 'SAVING…' : isPublished ? 'SAVE & PUBLISH' : 'SAVE DRAFT'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            background: statusMessage.type === 'ok' ? 'rgba(92, 219, 149, 0.15)' : 'rgba(229, 138, 120, 0.15)',
            color: statusMessage.type === 'ok' ? '#5cdb95' : '#f28b7e',
            border: `1px solid ${statusMessage.type === 'ok' ? 'rgba(92, 219, 149, 0.3)' : 'rgba(229, 138, 120, 0.3)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor Tabs */}
      <nav className="crm-tabs" style={{ margin: 0 }}>
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={activeTab === 'content' ? 'on' : ''}
        >
          1. Article Content & Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={activeTab === 'seo' ? 'on' : ''}
        >
          2. SEO & Generative AI (GEO)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={activeTab === 'preview' ? 'on' : ''}
        >
          3. Live Preview
        </button>
      </nav>

      {/* TAB 1: Content & Media */}
      {activeTab === 'content' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title & Slug */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <div className="crm-field">
                <label className="crm-label" htmlFor="post-title">Article Title *</label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (isNew && !slug) setSlug(slugify(e.target.value));
                    if (!metaTitle || metaTitle === title) setMetaTitle(e.target.value);
                  }}
                  placeholder="e.g., The Secret Feuds of 1850s Utah: Fact Behind Petticoats and Ash"
                  className="crm-input"
                  style={{ fontSize: 16, fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'flex-end', marginTop: 14 }}>
                <div className="crm-field" style={{ margin: 0 }}>
                  <label className="crm-label" htmlFor="post-slug">URL Slug</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: 13, color: 'var(--muted)' }}>
                      /blog/
                    </span>
                    <input
                      id="post-slug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="the-secret-feuds-of-1850s-utah"
                      className="crm-input"
                      style={{ borderRadius: '0 4px 4px 0', fontSize: 13 }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="crm-btn sec"
                  style={{ height: 42, fontSize: 11 }}
                  title="Generate clean slug from title"
                >
                  AUTO-SLUG
                </button>
              </div>
            </div>

            {/* Excerpt / Summary */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <div className="crm-field" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="crm-label" htmlFor="post-excerpt">Article Excerpt / Subhead</label>
                  <span style={{ fontSize: 11, color: excerpt.length > 250 ? 'var(--gold)' : 'var(--muted)' }}>
                    {excerpt.length} characters (Ideal: 120-220)
                  </span>
                </div>
                <textarea
                  id="post-excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value);
                    if (!metaDescription || metaDescription === excerpt) setMetaDescription(e.target.value);
                  }}
                  placeholder="A concise, captivating hook that summarizes the article for card previews, Google search, and social sharing..."
                  className="crm-input"
                  style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.5 }}
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <label className="crm-label" htmlFor="blog-content-area" style={{ margin: 0 }}>
                  Article Body (Markdown / HTML)
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => insertFormatting('## ', '\n')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>H2</button>
                  <button type="button" onClick={() => insertFormatting('### ', '\n')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>H3</button>
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>Bold</button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>Italic</button>
                  <button type="button" onClick={() => insertFormatting('> ', '\n')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>Quote</button>
                  <button type="button" onClick={() => insertFormatting('- ', '\n')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>Bullet</button>
                  <button type="button" onClick={() => insertFormatting('[Link Text](', ')')} className="crm-btn sec" style={{ padding: '4px 8px', fontSize: 11 }}>Link</button>
                </div>
              </div>

              <textarea
                id="blog-content-area"
                rows={22}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article here... You can use standard Markdown:&#10;&#10;## Section Heading&#10;&#10;Paragraph text with historical details...&#10;&#10;> An excerpt from a frontier journal or letter.&#10;&#10;### Another Point&#10;- Detail 1&#10;- Detail 2"
                className="crm-input"
                style={{
                  fontFamily: 'var(--mono, "Menlo", monospace)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  minHeight: 400,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                <span>{words} words · ~{autoReadTime} min read</span>
                <span>Supports Markdown & HTML tags</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Publish & Status Card */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, letterSpacing: '0.06em', color: 'var(--gold)' }}>
                PUBLISHING STATUS
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="chk" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>
                    <b style={{ color: isPublished ? '#5cdb95' : '#ffb74d' }}>
                      {isPublished ? 'Published' : 'Draft'}
                    </b>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                      {isPublished ? 'Visible publicly to readers & search bots' : 'Only visible in admin panel'}
                    </span>
                  </span>
                </label>

                <label className="chk" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span>
                    <b>Featured Article</b>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                      Highlighted in hero banner on public blog page
                    </span>
                  </span>
                </label>

                <div className="crm-field" style={{ margin: 0 }}>
                  <label className="crm-label" htmlFor="pub-date">Publish Date</label>
                  <input
                    id="pub-date"
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="crm-input"
                    style={{ fontSize: 13 }}
                  />
                </div>

                <div className="crm-field" style={{ margin: 0 }}>
                  <label className="crm-label" htmlFor="post-author">Author</label>
                  <input
                    id="post-author"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="crm-input"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Category & Tags Card */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, letterSpacing: '0.06em', color: 'var(--gold)' }}>
                TAXONOMY
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="crm-field" style={{ margin: 0 }}>
                  <label className="crm-label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== 'Custom') setCustomCategory('');
                    }}
                    className="crm-select"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--cream)',
                      border: '1px solid var(--line)',
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>

                  {category === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="crm-input"
                      style={{ marginTop: 8, fontSize: 13 }}
                    />
                  )}
                </div>

                <div className="crm-field" style={{ margin: 0 }}>
                  <label className="crm-label" htmlFor="post-tags">Tags (comma separated)</label>
                  <input
                    id="post-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Frontier, Mormon History, Utah, Writing"
                    className="crm-input"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Cover Image Card */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, letterSpacing: '0.06em', color: 'var(--gold)' }}>
                COVER IMAGE
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    style={{
                      width: '100%',
                      height: 140,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid var(--line)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 120,
                      borderRadius: 4,
                      border: '1px dashed var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--muted)',
                      fontSize: 12,
                    }}
                  >
                    No cover image yet
                  </div>
                )}

                <div className="crm-field" style={{ margin: 0 }}>
                  <label className="crm-label" htmlFor="cover-url">Image URL</label>
                  <input
                    id="cover-url"
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://... or /covers/..."
                    className="crm-input"
                    style={{ fontSize: 12 }}
                  />
                </div>

                <div>
                  <label className="drop" style={{ fontSize: 12, padding: 10, cursor: 'pointer' }}>
                    <Ic k="up" s={14} /> Upload image file
                    <input
                      id="blog-cover-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setCoverImageUrl(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                </div>

                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="crm-btn sec"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Remove Cover
                  </button>
                )}
              </div>
            </div>

            {/* Related Book CTA Card */}
            <div className="crm-panel" style={{ padding: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, letterSpacing: '0.06em', color: 'var(--gold)' }}>
                ATTACHED BOOK CTA
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                Embeds an interactive purchase & sample card at the end of this article to convert blog readers into Amazon buyers.
              </p>

              <select
                value={relatedBookSlug}
                onChange={(e) => setRelatedBookSlug(e.target.value)}
                className="crm-select"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--cream)',
                  border: '1px solid var(--line)',
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontSize: 13,
                }}
              >
                <option value="">No Book Attached</option>
                {books.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.title} ({b.status === 'available' ? 'Available' : 'Coming Soon'})
                  </option>
                ))}
              </select>

              {selectedBook && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(201,168,96,0.06)', border: '1px solid rgba(201,168,96,0.2)', borderRadius: 4, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{selectedBook.title}</div>
                  <div style={{ color: 'var(--gold)', fontSize: 11, marginTop: 2 }}>
                    {selectedBook.amazonUrl ? '✓ Has Amazon Buy Link' : '⚠️ No Amazon link yet'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEO & Generative AI (GEO) */}
      {activeTab === 'seo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Live Search Engine & AI Card Preview */}
          <div className="crm-panel" style={{ padding: 22, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, letterSpacing: '0.04em', color: 'var(--gold)' }}>
              LIVE SEARCH & AI SNIPPET PREVIEW
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--muted)' }}>
              This simulates how Google, ChatGPT Search, Perplexity, and Claude present this article to readers searching online.
            </p>

            <div
              style={{
                background: '#121212',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                padding: '16px 20px',
                maxWidth: 680,
                fontFamily: 'arial, sans-serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#bdc1c6' }}>kenmerrell.com</span>
                <span style={{ fontSize: 12, color: '#9aa0a6' }}>› blog › {slug || 'article-slug'}</span>
              </div>
              <div style={{ fontSize: 19, color: '#8ab4f8', fontWeight: 400, lineHeight: 1.3, marginBottom: 6, cursor: 'pointer' }}>
                {metaTitle || title || 'Untitled Blog Post | Ken Merrell'}
              </div>
              <div style={{ fontSize: 13, color: '#bdc1c6', lineHeight: 1.5 }}>
                {metaDescription || excerpt || 'Read this in-depth article by historical fiction author Ken Merrell exploring authentic archives and frontier drama.'}
              </div>
            </div>
          </div>

          {/* Meta Tags Form */}
          <div className="crm-panel" style={{ padding: 22, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, letterSpacing: '0.04em', color: 'var(--cream)' }}>
              GOOGLE & BING META TAGS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <div className="crm-field" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="crm-label" htmlFor="meta-title">Meta Title Tag</label>
                  <span style={{ fontSize: 11, color: metaTitle.length >= 50 && metaTitle.length <= 60 ? '#5cdb95' : 'var(--muted)' }}>
                    {metaTitle.length} / 60 chars {metaTitle.length >= 50 && metaTitle.length <= 60 ? '(Optimal)' : ''}
                  </span>
                </div>
                <input
                  id="meta-title"
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Primary search title (50-60 characters ideal)"
                  className="crm-input"
                />
              </div>

              <div className="crm-field" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="crm-label" htmlFor="meta-desc">Meta Description</label>
                  <span style={{ fontSize: 11, color: metaDescription.length >= 140 && metaDescription.length <= 160 ? '#5cdb95' : 'var(--muted)' }}>
                    {metaDescription.length} / 160 chars {metaDescription.length >= 140 && metaDescription.length <= 160 ? '(Optimal)' : ''}
                  </span>
                </div>
                <textarea
                  id="meta-desc"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Compelling 140-160 character summary that entices clicks from search results..."
                  className="crm-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* GEO Key Takeaways Manager */}
          <div className="crm-panel" style={{ padding: 22, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, letterSpacing: '0.04em', color: 'var(--gold)' }}>
                  GEO: KEY TAKEAWAYS (FOR CHATGPT, PERPLEXITY & CLAUDE)
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', maxWidth: 700, lineHeight: 1.5 }}>
                  Generative AI search engines actively extract bulleted executive summaries near the top of pages.
                  These bullet points ensure AI models cite Ken Merrell accurately with verified historical facts.
                </p>
              </div>
              <button
                type="button"
                onClick={addTakeaway}
                className="crm-btn sec"
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                + ADD BULLET POINT
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {keyTakeaways.map((takeaway, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14, minWidth: 20 }}>
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={takeaway}
                    onChange={(e) => updateTakeaway(idx, e.target.value)}
                    placeholder="Enter an authoritative summary bullet point..."
                    className="crm-input"
                    style={{ fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTakeaway(idx)}
                    disabled={keyTakeaways.length === 1}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e58a78',
                      cursor: 'pointer',
                      padding: 6,
                      fontSize: 16,
                      opacity: keyTakeaways.length === 1 ? 0.3 : 1,
                    }}
                    title="Remove bullet point"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GEO & Google Schema.org FAQs Manager */}
          <div className="crm-panel" style={{ padding: 22, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, letterSpacing: '0.04em', color: 'var(--gold)' }}>
                  GEO & SCHEMA.ORG FAQS (RICH SNIPPETS & DIRECT ANSWERS)
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', maxWidth: 700, lineHeight: 1.5 }}>
                  Generates an automatic schema.org <code style={{ color: 'var(--gold)' }}>FAQPage</code> JSON-LD structure.
                  Google displays expandable FAQ accordions in search results, and ChatGPT quotes these Q&As directly when answering user queries.
                </p>
              </div>
              <button
                type="button"
                onClick={addFaq}
                className="crm-btn sec"
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                + ADD FAQ PAIR
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {faqItems.map((faq, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
                      Question #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      disabled={faqItems.length === 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#e58a78',
                        cursor: 'pointer',
                        fontSize: 12,
                        opacity: faqItems.length === 1 ? 0.3 : 1,
                      }}
                    >
                      Delete FAQ
                    </button>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="e.g., Is Petticoats and Ash based on actual frontier court records?"
                    className="crm-input"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                    placeholder="Clear, factual answer that generative engines can directly quote..."
                    className="crm-input"
                    style={{ fontSize: 13, resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live Reader Preview */}
      {activeTab === 'preview' && (
        <div style={{ background: '#0a0908', border: '1px solid var(--line)', borderRadius: 8, padding: '40px 24px', maxWidth: 840, margin: '0 auto', width: '100%' }}>
          {/* Breadcrumb preview */}
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Blog › {category}
          </div>

          <h1 style={{ fontSize: 34, fontFamily: 'var(--serif, Georgia, serif)', color: 'var(--cream)', lineHeight: 1.25, margin: '0 0 16px' }}>
            {title || 'Untitled Article'}
          </h1>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
            <span>By <b>{authorName}</b></span>
            <span>•</span>
            <span>{new Date(publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>{autoReadTime} min read</span>
          </div>

          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={title}
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 6, marginBottom: 32 }}
            />
          )}

          {/* GEO Key Takeaways box */}
          {keyTakeaways.filter((t) => t.trim()).length > 0 && (
            <div
              style={{
                background: 'rgba(201,168,96,0.06)',
                border: '1px solid rgba(201,168,96,0.25)',
                borderLeft: '4px solid var(--gold)',
                borderRadius: 4,
                padding: '20px 24px',
                marginBottom: 32,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
                ⚡ Key Takeaways
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--cream)', fontSize: 14, lineHeight: 1.5 }}>
                {keyTakeaways.filter((t) => t.trim()).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Excerpt lead */}
          {excerpt && (
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#d8ccb8', fontStyle: 'italic', marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 24 }}>
              {excerpt}
            </p>
          )}

          {/* Body */}
          <div
            style={{
              color: '#ded3c1',
              fontSize: 16,
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {content || 'Start typing in Tab 1 to see your article body preview here.'}
          </div>

          {/* FAQs section preview */}
          {faqItems.filter((f) => f.question.trim() && f.answer.trim()).length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
              <h2 style={{ fontSize: 22, color: 'var(--gold)', marginBottom: 20 }}>
                Frequently Asked Questions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {faqItems.filter((f) => f.question.trim() && f.answer.trim()).map((faq, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 6, padding: 18 }}>
                    <h3 style={{ fontSize: 15, color: 'var(--cream)', margin: '0 0 8px' }}>
                      {faq.question}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached book CTA preview */}
          {selectedBook && (
            <div style={{ marginTop: 48, padding: 24, background: '#1c1712', border: '1px solid rgba(201,168,96,0.3)', borderRadius: 6, display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Related Book by Ken Merrell
                </span>
                <h3 style={{ fontSize: 20, color: 'var(--cream)', margin: '4px 0 8px' }}>
                  {selectedBook.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                  {selectedBook.tagline || selectedBook.description?.slice(0, 140) + '...'}
                </p>
              </div>
              <div>
                <span className="crm-btn pri" style={{ fontSize: 12 }}>
                  EXPLORE BOOK →
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Save Bar at bottom */}
      <div
        style={{
          position: 'sticky',
          bottom: 16,
          background: 'rgba(20, 18, 15, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isPublished ? '#5cdb95' : '#ffb74d',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>
            {isPublished ? 'Ready to Publish' : 'Draft Mode'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            • {words} words • {keyTakeaways.filter(Boolean).length} Takeaways • {faqItems.filter((f) => f.question).length} FAQs
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/blogs" className="crm-btn sec" style={{ fontSize: 12 }}>
            CANCEL
          </Link>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isPending}
            className="crm-btn pri"
            style={{ fontSize: 13, padding: '8px 18px' }}
          >
            <Ic k="check" s={15} sw={1.8} />
            {isPending ? 'SAVING…' : isPublished ? 'SAVE & PUBLISH' : 'SAVE DRAFT'}
          </button>
        </div>
      </div>
    </div>
  );
}
