'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ic } from '@/components/admin/AdIcons';
import type { BlogPost, Book, BlogFAQItem, BlogComment } from '@/lib/types';
import { saveBlogPostAction, deleteBlogCommentAction, replyBlogCommentAction, toggleBlogCommentApprovalAction } from '@/app/admin/actions';
import { Cover } from '@/components/Bits';
import BlogContentRenderer from '@/components/blog/BlogContentRenderer';

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
  const [isPublished, setIsPublished] = useState(initialBlog.isPublished ?? false);
  const [savingMode, setSavingMode] = useState<'draft' | 'publish' | null>(null);
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

  // Reader comments
  const [comments, setComments] = useState<BlogComment[]>(initialBlog.comments || []);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Editor body view toggle (Write, Split View, or Full Live Preview)
  const [bodyMode, setBodyMode] = useState<'write' | 'split' | 'preview'>('split');
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Word count & read time
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

  const insertFormatting = (action: 'h2' | 'h3' | 'bold' | 'italic' | 'quote' | 'bullet' | 'list' | 'link') => {
    const textarea = document.getElementById('blog-content-area') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
      case 'h2': {
        const text = selected.trim() || 'Subheading Title';
        const before = start > 0 && !content.slice(0, start).endsWith('\n\n')
          ? (content.slice(0, start).endsWith('\n') ? '\n' : '\n\n') : '';
        const after = !content.slice(end).startsWith('\n\n')
          ? (content.slice(end).startsWith('\n') ? '\n' : '\n\n') : '';
        replacement = `${before}## ${text}${after}`;
        cursorOffset = replacement.length;
        break;
      }
      case 'h3': {
        const text = selected.trim() || 'Minor Section Title';
        const before = start > 0 && !content.slice(0, start).endsWith('\n\n')
          ? (content.slice(0, start).endsWith('\n') ? '\n' : '\n\n') : '';
        const after = !content.slice(end).startsWith('\n\n')
          ? (content.slice(end).startsWith('\n') ? '\n' : '\n\n') : '';
        replacement = `${before}### ${text}${after}`;
        cursorOffset = replacement.length;
        break;
      }
      case 'bold': {
        const text = selected || 'bold text';
        replacement = `**${text}**`;
        cursorOffset = replacement.length;
        break;
      }
      case 'italic': {
        const text = selected || 'italic text';
        replacement = `*${text}*`;
        cursorOffset = replacement.length;
        break;
      }
      case 'quote': {
        const text = selected.trim() || 'Historical quote or key excerpt goes here.';
        const before = start > 0 && !content.slice(0, start).endsWith('\n\n')
          ? (content.slice(0, start).endsWith('\n') ? '\n' : '\n\n') : '';
        const after = !content.slice(end).startsWith('\n\n')
          ? (content.slice(end).startsWith('\n') ? '\n' : '\n\n') : '';
        const formattedQuote = text.split('\n').map((l) => `> ${l}`).join('\n');
        replacement = `${before}${formattedQuote}${after}`;
        cursorOffset = replacement.length;
        break;
      }
      case 'bullet': {
        const before = start > 0 && !content.slice(0, start).endsWith('\n\n')
          ? (content.slice(0, start).endsWith('\n') ? '\n' : '\n\n') : '';
        const after = !content.slice(end).startsWith('\n\n')
          ? (content.slice(end).startsWith('\n') ? '\n' : '\n\n') : '';
        if (selected.trim()) {
          const lines = selected.split('\n').map((l) => `- ${l.replace(/^[-*•]\s*/, '')}`).join('\n');
          replacement = `${before}${lines}${after}`;
        } else {
          replacement = `${before}- Key takeaway point one\n- Key takeaway point two${after}`;
        }
        cursorOffset = replacement.length;
        break;
      }
      case 'list': {
        const before = start > 0 && !content.slice(0, start).endsWith('\n\n')
          ? (content.slice(0, start).endsWith('\n') ? '\n' : '\n\n') : '';
        const after = !content.slice(end).startsWith('\n\n')
          ? (content.slice(end).startsWith('\n') ? '\n' : '\n\n') : '';
        if (selected.trim()) {
          const lines = selected.split('\n').map((l, idx) => `${idx + 1}. ${l.replace(/^\d+[.)]\s*/, '')}`).join('\n');
          replacement = `${before}${lines}${after}`;
        } else {
          replacement = `${before}1. First chronological event\n2. Second chronological event${after}`;
        }
        cursorOffset = replacement.length;
        break;
      }
      case 'link': {
        if (selected.trim()) {
          replacement = `[${selected.trim()}](https://example.com)`;
        } else {
          replacement = `[Link description](https://example.com)`;
        }
        cursorOffset = replacement.length;
        break;
      }
    }

    const nextContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 15);
  };

  // Takeaways
  const updateTakeaway = (idx: number, val: string) => {
    const copy = [...keyTakeaways];
    copy[idx] = val;
    setKeyTakeaways(copy);
  };
  const addTakeaway = () => setKeyTakeaways([...keyTakeaways, '']);
  const removeTakeaway = (idx: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx));
  };

  // FAQs
  const updateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    const copy = [...faqItems];
    copy[idx] = { ...copy[idx], [field]: val };
    setFaqItems(copy);
  };
  const addFaq = () => setFaqItems([...faqItems, { question: '', answer: '' }]);
  const removeFaq = (idx: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== idx));
  };

  const handleSave = async (targetPublishedStatus?: boolean) => {
    setStatusMessage(null);

    if (!title.trim()) {
      setStatusMessage({ type: 'err', text: 'Please provide an article title.' });
      return;
    }

    const willBePublished = typeof targetPublishedStatus === 'boolean' ? targetPublishedStatus : isPublished;
    setIsPublished(willBePublished);
    setSavingMode(willBePublished ? 'publish' : 'draft');

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
    formData.set('isPublished', String(willBePublished));
    formData.set('featured', String(featured));
    formData.set('publishedAt', new Date(publishedAt).toISOString());
    formData.set('relatedBookSlug', relatedBookSlug || 'none');
    formData.set('metaTitle', metaTitle.trim() || title.trim());
    formData.set('metaDescription', metaDescription.trim() || excerpt.trim());
    formData.set('keyTakeaways', JSON.stringify(keyTakeaways.filter((t) => t.trim())));
    formData.set('faqItems', JSON.stringify(faqItems.filter((f) => f.question.trim() && f.answer.trim())));

    const fileInput = document.getElementById('blog-cover-file') as HTMLInputElement | null;
    if (fileInput?.files?.[0]) {
      formData.set('coverImageFile', fileInput.files[0]);
    }

    startTransition(async () => {
      try {
        const res = await saveBlogPostAction({}, formData);
        if (res.ok) {
          setStatusMessage({
            type: 'ok',
            text: willBePublished ? 'Article saved and published live!' : 'Article saved as draft successfully.',
          });
          if (isNew && res.id) {
            router.push(`/admin/blogs/${res.id}`);
          } else {
            router.refresh();
          }
        } else {
          setStatusMessage({ type: 'err', text: res.error || 'Failed to save blog post.' });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'err', text: err?.message || 'Failed to save blog post.' });
      } finally {
        setSavingMode(null);
      }
    });
  };

  const selectedBook = books.find((b) => b.slug === relatedBookSlug);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Breadcrumb Navigation ── */}
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/admin/blogs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
          <Ic k="back" s={14} /> Back to Blog Posts
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--soft)' }}>{isNew ? 'New article' : 'Edit article'}</span>
      </nav>

      {/* ── Top Header Controls ── */}
      <div className="crm-top">
        <div>
          <h1>{isNew ? 'New article' : title.trim() || 'Untitled article'}</h1>
          <p>
            {isNew
              ? 'Draft an article, historical essay, or research note for your readers. You can save as a draft anytime.'
              : isPublished
              ? 'This article is currently published live on your public blog.'
              : 'This article is currently saved as an unpublished draft.'}
          </p>
        </div>
        <div className="crm-actions">
          <Link href="/admin/blogs" className="crm-btn" title="Back to blog posts">
            <Ic k="back" s={16} />BACK TO POSTS
          </Link>
          {!isNew && isPublished && slug && (
            <a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="crm-btn" title="View live article">
              <Ic k="ext" s={16} />VIEW ARTICLE
            </a>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="crm-btn"
            style={{
              borderColor: !isPublished ? 'rgba(226,184,106,0.6)' : undefined,
              color: !isPublished ? 'var(--gold)' : undefined,
              background: !isPublished ? 'rgba(226,184,106,0.08)' : undefined,
            }}
            title="Save changes as an unpublished draft (not visible publicly)"
          >
            <Ic k="file" s={15} sw={1.8} />
            {isPending && savingMode === 'draft' ? 'SAVING DRAFT…' : 'SAVE AS DRAFT'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="crm-btn pri"
            title="Publish article live to readers on the website"
          >
            <Ic k="check" s={16} sw={2} />
            {isPending && savingMode === 'publish'
              ? 'PUBLISHING…'
              : isPublished
              ? 'SAVE & PUBLISH'
              : 'PUBLISH NOW'}
          </button>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {statusMessage && (
        <div className={statusMessage.type === 'ok' ? 'crm-ok' : 'crm-err'} role="alert">
          <Ic k={statusMessage.type === 'ok' ? 'check' : 'trash'} s={18} sw={2} />
          <span><b>{statusMessage.type === 'ok' ? 'Success:' : 'Notice:'}</b> {statusMessage.text}</span>
        </div>
      )}

      {/* ── Main 2-Column Editor Layout ── */}
      <div className="crm-editor">
        {/* Main Column */}
        <div className="col">
          {/* Card 1: The Basics */}
          <section className="crm-card">
            <h2>The basics</h2>
            <div className="crm-field">
              <label className="crm-label" htmlFor="blog-title">ARTICLE TITLE *</label>
              <input
                id="blog-title"
                type="text"
                className="crm-in"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (isNew && !slug) setSlug(slugify(e.target.value));
                  if (!metaTitle || metaTitle === title) setMetaTitle(e.target.value);
                }}
                placeholder="e.g. Why 19th-Century Justice Was More Dangerous Than the Crime"
              />
            </div>

            <div className="crm-grid2">
              <div className="crm-field">
                <label className="crm-label" htmlFor="blog-slug">URL SLUG</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ height: 48, padding: '0 12px', background: '#0a0908', border: '1px solid #3a332b', borderRight: 'none', borderRadius: '3px 0 0 3px', display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    /blog/
                  </span>
                  <input
                    id="blog-slug"
                    type="text"
                    className="crm-in"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="why-19th-century-justice"
                    style={{ borderRadius: '0 3px 3px 0' }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="crm-sm"
                    style={{ marginLeft: 8, height: 48, whiteSpace: 'nowrap' }}
                    title="Auto-generate slug from title"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div className="crm-field">
                <label className="crm-label" htmlFor="blog-category">CATEGORY</label>
                <select
                  id="blog-category"
                  className="crm-in"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== 'Custom') setCustomCategory('');
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
                    className="crm-in"
                    placeholder="Type custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            </div>

            <div className="crm-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="crm-label" htmlFor="blog-excerpt">SUMMARY / EXCERPT</label>
                <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.08em', color: excerpt.length > 250 ? 'var(--gold)' : 'var(--muted)' }}>
                  {excerpt.length} characters (120–220 optimal)
                </span>
              </div>
              <textarea
                id="blog-excerpt"
                className="crm-in"
                rows={3}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  if (!metaDescription || metaDescription === excerpt) setMetaDescription(e.target.value);
                }}
                placeholder="A compelling summary hook that appears on the blog index, social previews, and Google search..."
                style={{ height: 'auto', minHeight: 90 }}
              />
              <span className="help">Shown as the preview hook on card feeds and in search results.</span>
            </div>

            <div className="crm-field">
              <label className="crm-label" htmlFor="blog-tags">TAGS (COMMA SEPARATED)</label>
              <input
                id="blog-tags"
                type="text"
                className="crm-in"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Historical Research, Frontier Justice, Utah, Mormons, Writing Craft"
              />
            </div>
          </section>

          {/* Card 2: Article Body & Markdown */}
          <section className="crm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>Article body</h2>
                <p className="sub" style={{ marginTop: 4, marginBottom: 0 }}>
                  Write your story using standard Markdown or HTML. Live word count and reading time calculate automatically.
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="crm-tabs" style={{ margin: 0 }}>
                <button
                  type="button"
                  onClick={() => setBodyMode('write')}
                  className={bodyMode === 'write' ? 'on' : ''}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setBodyMode('split')}
                  className={bodyMode === 'split' ? 'on' : ''}
                  title="Side-by-side editing and live preview"
                >
                  Split View
                </button>
                <button
                  type="button"
                  onClick={() => setBodyMode('preview')}
                  className={bodyMode === 'preview' ? 'on' : ''}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {/* Split View (Side by Side) */}
            {bodyMode === 'split' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 16,
                  alignItems: 'stretch',
                }}
              >
                {/* Editor Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: '#120f0d', border: '1px solid #3a332b', borderRadius: 4 }}>
                    <button type="button" onClick={() => insertFormatting('h2')} className="crm-sm" title="Heading 2 (##)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontWeight: 600 }}>H2</button>
                    <button type="button" onClick={() => insertFormatting('h3')} className="crm-sm" title="Heading 3 (###)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontWeight: 600 }}>H3</button>
                    <button type="button" onClick={() => insertFormatting('bold')} className="crm-sm" title="Bold (**text**)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontWeight: 700 }}>B</button>
                    <button type="button" onClick={() => insertFormatting('italic')} className="crm-sm" title="Italic (*text*)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontStyle: 'italic' }}>I</button>
                    <button type="button" onClick={() => insertFormatting('quote')} className="crm-sm" title="Blockquote (>)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>Quote</button>
                    <button type="button" onClick={() => insertFormatting('bullet')} className="crm-sm" title="Bullet List (-)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>Bullet</button>
                    <button type="button" onClick={() => insertFormatting('list')} className="crm-sm" title="Numbered List (1.)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>1. List</button>
                    <button type="button" onClick={() => insertFormatting('link')} className="crm-sm" title="Link [text](url)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>Link</button>
                  </div>

                  <textarea
                    id="blog-content-area"
                    className="crm-in"
                    rows={20}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your article here..."
                    style={{
                      fontFamily: 'var(--serif-b, Georgia, serif)',
                      fontSize: 15,
                      lineHeight: 1.75,
                      minHeight: 460,
                      resize: 'vertical',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    <span><b>{words.toLocaleString()}</b> words · ~<b>{autoReadTime}</b> min read</span>
                    <span>Markdown &amp; HTML supported</span>
                  </div>
                </div>

                {/* Live Preview Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#120f0d', border: '1px solid #3a332b', borderRadius: 4, height: 42 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.1em', color: 'var(--gold)', fontWeight: 600 }}>
                      REAL-TIME LIVE PREVIEW
                    </span>
                    <span style={{ fontSize: 11, color: '#888' }}>Updates as you type</span>
                  </div>

                  <div
                    style={{
                      background: '#0a0908',
                      border: '1px solid #3a332b',
                      borderRadius: 4,
                      padding: '24px 28px',
                      minHeight: 460,
                      maxHeight: 650,
                      overflowY: 'auto',
                    }}
                  >
                    <BlogContentRenderer content={content || '*Type or click formatting buttons on the left to see live styled results here.*'} />
                  </div>
                </div>
              </div>
            )}

            {/* Write-only Mode */}
            {bodyMode === 'write' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Formatting Bar */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: '#120f0d', border: '1px solid #3a332b', borderRadius: 4 }}>
                  <button type="button" onClick={() => insertFormatting('h2')} className="crm-sm" title="Heading 2 (##)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontWeight: 600 }}>H2</button>
                  <button type="button" onClick={() => insertFormatting('h3')} className="crm-sm" title="Heading 3 (###)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontWeight: 600 }}>H3</button>
                  <button type="button" onClick={() => insertFormatting('bold')} className="crm-sm" title="Bold (**text**)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontWeight: 700 }}>B</button>
                  <button type="button" onClick={() => insertFormatting('italic')} className="crm-sm" title="Italic (*text*)" style={{ height: 32, padding: '0 9px', fontSize: 11, fontStyle: 'italic' }}>I</button>
                  <button type="button" onClick={() => insertFormatting('quote')} className="crm-sm" title="Blockquote (>)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>Quote</button>
                  <button type="button" onClick={() => insertFormatting('bullet')} className="crm-sm" title="Bullet List (-)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>Bullet</button>
                  <button type="button" onClick={() => insertFormatting('list')} className="crm-sm" title="Numbered List (1.)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>1. List</button>
                  <button type="button" onClick={() => insertFormatting('link')} className="crm-sm" title="Link [text](url)" style={{ height: 32, padding: '0 9px', fontSize: 11 }}>Link</button>
                </div>

                <textarea
                  id="blog-content-area"
                  className="crm-in"
                  rows={20}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your article here..."
                  style={{
                    fontFamily: 'var(--serif-b, Georgia, serif)',
                    fontSize: 15,
                    lineHeight: 1.75,
                    minHeight: 440,
                    resize: 'vertical',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
                  <span><b>{words.toLocaleString()}</b> words · ~<b>{autoReadTime}</b> min read</span>
                  <span>Markdown &amp; HTML supported</span>
                </div>
              </div>
            )}

            {/* Preview-only Mode */}
            {bodyMode === 'preview' && (
              <div
                style={{
                  background: '#0a0908',
                  border: '1px solid #3a332b',
                  borderRadius: 4,
                  padding: 28,
                  minHeight: 440,
                }}
              >
                <BlogContentRenderer content={content || '*No content written yet. Switch to Write tab to begin.*'} />
              </div>
            )}
          </section>

          {/* Card 3: Search & AI Optimization (SEO & GEO) */}
          <section className="crm-card">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Ic k="globe" s={22} />
                Search &amp; AI engine optimization (SEO &amp; GEO)
              </h2>
              <p className="sub" style={{ marginTop: 6, marginBottom: 0 }}>
                Generates Schema.org JSON-LD and structured executive summaries extracted by Google, ChatGPT Search, Claude, and Perplexity.
              </p>
            </div>

            {/* Google & AI SERP Simulator */}
            <div style={{ background: '#12100e', border: '1px solid #3a332b', borderRadius: 4, padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.12em', color: 'var(--gold)', fontWeight: 600 }}>
                SEARCH ENGINE SNIPPET PREVIEW
              </span>
              <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                kenmerrell.com › blog › {slug || 'article-slug'}
              </div>
              <div style={{ fontSize: 18, color: '#8ab4f8', lineHeight: 1.3, fontWeight: 500 }}>
                {metaTitle || title || 'Untitled Article'}
              </div>
              <div style={{ fontSize: 13, color: '#bdc1c6', lineHeight: 1.5 }}>
                {metaDescription || excerpt || 'Article description appearing in search results.'}
              </div>
            </div>

            <div className="crm-grid2">
              <div className="crm-field">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="crm-label" htmlFor="meta-title">META TITLE</label>
                  <span style={{ fontSize: 11, color: metaTitle.length >= 50 && metaTitle.length <= 60 ? '#6dbf78' : 'var(--muted)' }}>
                    {metaTitle.length} / 60
                  </span>
                </div>
                <input
                  id="meta-title"
                  type="text"
                  className="crm-in"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Primary SEO title"
                />
              </div>

              <div className="crm-field">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="crm-label" htmlFor="meta-desc">META DESCRIPTION</label>
                  <span style={{ fontSize: 11, color: metaDescription.length >= 140 && metaDescription.length <= 160 ? '#6dbf78' : 'var(--muted)' }}>
                    {metaDescription.length} / 160
                  </span>
                </div>
                <input
                  id="meta-desc"
                  type="text"
                  className="crm-in"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Search snippet summary"
                />
              </div>
            </div>

            {/* GEO Key Takeaways Builder */}
            <div className="crm-field" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="crm-label">⚡ GEO KEY TAKEAWAYS (FOR CHATGPT, PERPLEXITY &amp; CLAUDE)</label>
                  <p className="help" style={{ margin: '4px 0 0' }}>Bullet points extracted by AI models to summarize this article in generative answers.</p>
                </div>
                <button type="button" onClick={addTakeaway} className="crm-btn" style={{ height: 34, padding: '0 12px', fontSize: 10 }}>
                  <Ic k="plus" s={14} /> ADD BULLET
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {keyTakeaways.map((takeaway, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13, minWidth: 22 }}>
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      className="crm-in"
                      value={takeaway}
                      onChange={(e) => updateTakeaway(idx, e.target.value)}
                      placeholder="Concise, factual key takeaway..."
                    />
                    <button
                      type="button"
                      onClick={() => removeTakeaway(idx)}
                      disabled={keyTakeaways.length === 1}
                      className="crm-sm icon danger"
                      style={{ height: 48, width: 48, flexShrink: 0 }}
                      title="Remove bullet"
                    >
                      <Ic k="trash" s={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Schema.org FAQs Builder */}
            <div className="crm-field" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="crm-label">❓ FAQPAGE SCHEMA &amp; DIRECT ANSWERS</label>
                  <p className="help" style={{ margin: '4px 0 0' }}>Injected into Schema.org FAQPage JSON-LD for Google expandable search snippets.</p>
                </div>
                <button type="button" onClick={addFaq} className="crm-btn" style={{ height: 34, padding: '0 12px', fontSize: 10 }}>
                  <Ic k="plus" s={14} /> ADD FAQ
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
                {faqItems.map((faq, idx) => (
                  <div key={idx} style={{ background: '#120f0d', border: '1px solid #3a332b', borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.1em', color: 'var(--gold)', fontWeight: 600 }}>
                        QUESTION {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        disabled={faqItems.length === 1}
                        className="crm-sm danger"
                        style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      className="crm-in"
                      value={faq.question}
                      onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                      placeholder="e.g. Is this story based on true archival records?"
                    />
                    <textarea
                      rows={2}
                      className="crm-in"
                      value={faq.answer}
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                      placeholder="Direct factual answer that search engines can quote..."
                      style={{ height: 'auto', minHeight: 70 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section: Reader Comments & Moderation */}
          {!isNew && (
            <section id="comments" className="crm-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Reader Comments ({comments.length})</h2>
                  <p className="crm-note" style={{ marginTop: 2 }}>
                    Reflections and questions submitted by readers on this article.
                  </p>
                </div>
              </div>

              {comments.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 4, color: 'var(--muted)', fontSize: 13 }}>
                  No reader comments on this article yet. Once posted by readers, they will appear here for moderation and replies.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: 16,
                        background: '#120f0d',
                        border: '1px solid rgba(239,231,214,0.08)',
                        borderRadius: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <b style={{ color: 'var(--cream)', fontSize: 15 }}>{comment.authorName}</b>
                          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
                            {comment.authorEmail} · {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await toggleBlogCommentApprovalAction(initialBlog.id, comment.id);
                              if (res.ok) {
                                setComments((prev) =>
                                  prev.map((c) => (c.id === comment.id ? { ...c, approved: !c.approved } : c))
                                );
                              }
                            }}
                            className={`crm-sm ${comment.approved ? '' : 'gold'}`}
                            style={{ height: 30, fontSize: 11, padding: '0 10px' }}
                          >
                            {comment.approved ? 'Live (Hide)' : 'Hidden (Approve)'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Delete comment from ${comment.authorName}?`)) return;
                              const res = await deleteBlogCommentAction(initialBlog.id, comment.id);
                              if (res.ok) {
                                setComments((prev) => prev.filter((c) => c.id !== comment.id));
                              }
                            }}
                            className="crm-sm danger icon"
                            style={{ height: 30, width: 30 }}
                            title="Delete comment"
                          >
                            <Ic k="trash" s={13} />
                          </button>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: 14, color: 'var(--cream-2)', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                        {comment.content}
                      </p>

                      {/* Author Reply */}
                      {comment.authorReply ? (
                        <div style={{ padding: '10px 14px', background: 'rgba(201,168,96,0.08)', borderLeft: '3px solid var(--gold)', borderRadius: '0 4px 4px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                              Ken Merrell&apos;s Reply:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingId(comment.id);
                                setReplyText(comment.authorReply || '');
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Edit Reply
                            </button>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#f0e6d6', fontStyle: 'italic' }}>
                            &ldquo;{comment.authorReply}&rdquo;
                          </p>
                        </div>
                      ) : replyingId !== comment.id ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(comment.id);
                              setReplyText('');
                            }}
                            className="crm-sm"
                            style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                          >
                            Reply as Ken
                          </button>
                        </div>
                      ) : null}

                      {/* Reply Editor */}
                      {replyingId === comment.id && (
                        <div style={{ marginTop: 8, padding: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,96,0.3)', borderRadius: 4 }}>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--gold)', marginBottom: 6, fontWeight: 700, letterSpacing: '.06em' }}>
                            REPLY TO {comment.authorName.toUpperCase()}:
                          </label>
                          <textarea
                            rows={3}
                            className="crm-in"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a response as Ken..."
                            style={{ height: 'auto', minHeight: 70, marginBottom: 8 }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!replyText.trim()) return;
                                const res = await replyBlogCommentAction(initialBlog.id, comment.id, replyText);
                                if (res.ok) {
                                  setComments((prev) =>
                                    prev.map((c) => (c.id === comment.id ? { ...c, authorReply: replyText, authorReplyAt: new Date().toISOString() } : c))
                                  );
                                  setReplyingId(null);
                                  setReplyText('');
                                }
                              }}
                              className="crm-sm pri"
                              style={{ height: 30, fontSize: 11, padding: '0 12px' }}
                            >
                              Save Reply
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingId(null);
                                setReplyText('');
                              }}
                              className="crm-sm"
                              style={{ height: 30, fontSize: 11 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Sticky Sidebar */}
        <aside className="col side">
          {/* Card: Publishing */}
          <section className="crm-card">
            <h2>Publishing</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status Indicator Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: isPublished ? 'rgba(109,191,120,0.1)' : 'rgba(226,184,106,0.1)',
                  border: `1px solid ${isPublished ? 'rgba(109,191,120,0.3)' : 'rgba(226,184,106,0.3)'}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isPublished ? '#6dbf78' : '#e2b86a',
                    flexShrink: 0,
                    boxShadow: isPublished ? '0 0 8px rgba(109,191,120,0.6)' : '0 0 8px rgba(226,184,106,0.5)',
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isPublished ? '#6dbf78' : 'var(--gold)',
                      letterSpacing: '.08em',
                      fontFamily: 'var(--serif-c)',
                    }}
                  >
                    {isPublished ? 'STATUS: PUBLISHED LIVE' : 'STATUS: DRAFT (HIDDEN)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {isPublished ? 'Visible to readers on /blog' : 'Only visible inside admin CRM'}
                  </div>
                </div>
              </div>

              {/* Published Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 14, color: isPublished ? 'var(--cream-2)' : 'var(--muted)' }}>
                    {isPublished ? 'Published' : 'Draft'}
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {isPublished ? 'Toggle off to make draft' : 'Toggle on to publish live'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  className="switch"
                  aria-checked={isPublished}
                  onClick={() => setIsPublished(!isPublished)}
                  title={isPublished ? 'Switch to Draft' : 'Switch to Published'}
                >
                  <span />
                </button>
              </div>

              {/* Quick Save Buttons inside Publishing Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(239,231,214,.06)' }}>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isPending}
                  className="crm-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 40,
                    fontSize: 11,
                    borderColor: !isPublished ? 'rgba(226,184,106,0.6)' : undefined,
                    color: !isPublished ? 'var(--gold)' : undefined,
                    background: !isPublished ? 'rgba(226,184,106,0.08)' : undefined,
                  }}
                  title="Save article as an unpublished draft"
                >
                  <Ic k="file" s={14} sw={1.8} />
                  {isPending && savingMode === 'draft' ? 'SAVING DRAFT…' : 'SAVE AS DRAFT'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isPending}
                  className="crm-btn pri"
                  style={{ width: '100%', justifyContent: 'center', height: 40, fontSize: 11 }}
                  title="Save and publish article live"
                >
                  <Ic k="check" s={15} sw={2} />
                  {isPending && savingMode === 'publish'
                    ? 'PUBLISHING…'
                    : isPublished
                    ? 'SAVE & PUBLISH'
                    : 'PUBLISH NOW'}
                </button>
              </div>

              {/* Featured Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(239,231,214,.06)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 14, color: 'var(--cream-2)' }}>
                    Featured Article
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Pinned to blog hero spotlight
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  className="switch"
                  aria-checked={featured}
                  onClick={() => setFeatured(!featured)}
                >
                  <span />
                </button>
              </div>

              <div className="crm-field" style={{ paddingTop: 6 }}>
                <label className="crm-label" htmlFor="pub-date">PUBLISH DATE</label>
                <input
                  id="pub-date"
                  type="date"
                  className="crm-in"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>

              <div className="crm-field">
                <label className="crm-label" htmlFor="author-name">AUTHOR</label>
                <input
                  id="author-name"
                  type="text"
                  className="crm-in"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>

              {!isNew && (
                <div style={{ padding: '12px 14px', background: 'rgba(201,168,96,.06)', border: '1px solid rgba(201,168,96,.2)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Total Readers:</span>
                  <b style={{ fontSize: 16, color: 'var(--gold)', fontFamily: 'var(--serif-d)' }}>{(initialBlog.views || 0).toLocaleString()}</b>
                </div>
              )}
            </div>
          </section>

          {/* Card: Cover Image */}
          <section className="crm-card">
            <h2>Cover image</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {coverImageUrl ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.6)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImageUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', aspectRatio: '16/9', border: '1px dashed #4a4137', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6457', fontSize: 13, textAlign: 'center', padding: 12, borderRadius: 4 }}>
                  No cover image yet
                </div>
              )}

              <div className="crm-field">
                <label className="crm-label" htmlFor="cover-url">IMAGE WEB ADDRESS</label>
                <input
                  id="cover-url"
                  type="text"
                  className="crm-in"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://... or /covers/..."
                />
              </div>

              <label className="drop" style={{ justifyContent: 'center', minHeight: 44 }}>
                <Ic k="up" s={16} /> Choose image file
                <input
                  id="blog-cover-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCoverImageUrl(URL.createObjectURL(f));
                  }}
                />
              </label>

              {coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="crm-sm danger"
                  style={{ justifyContent: 'center' }}
                >
                  <Ic k="trash" s={14} /> Remove image
                </button>
              )}
            </div>
          </section>

          {/* Card: Attached Book CTA */}
          <section className="crm-card">
            <h2>Promote a book</h2>
            <p className="sub" style={{ marginTop: -8 }}>
              Embeds a purchase card at the bottom of the article to convert readers into Amazon buyers.
            </p>

            <div className="crm-field">
              <label className="crm-label">ATTACHED BOOK</label>
              <select
                className="crm-in"
                value={relatedBookSlug}
                onChange={(e) => setRelatedBookSlug(e.target.value)}
              >
                <option value="">No Book Attached</option>
                {books.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedBook && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, background: '#120f0d', border: '1px solid rgba(201,168,96,.3)', borderRadius: 4, marginTop: 4 }}>
                <div style={{ width: 44, height: 66, flexShrink: 0, position: 'relative' }}>
                  <Cover book={selectedBook} w={44} h={66} title={8} author={4} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 13, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedBook.title}
                  </strong>
                  <span style={{ fontSize: 11, color: selectedBook.amazonUrl ? '#6dbf78' : 'var(--gold)' }}>
                    {selectedBook.amazonUrl ? '✓ Amazon link active' : '⚠️ No Amazon link'}
                  </span>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* ── Bottom Floating Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#1a1612', border: '1px solid rgba(239,231,214,.1)', borderRadius: 4, marginTop: 12, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPublished ? '#6dbf78' : '#e2b86a' }} />
          <span style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 500 }}>
            {isPublished ? 'Status: Published live' : 'Status: Saved as draft'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            · {words} words · {keyTakeaways.filter(Boolean).length} GEO takeaways
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin/blogs" className="crm-btn">CANCEL</Link>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="crm-btn"
            style={{
              borderColor: !isPublished ? 'rgba(226,184,106,0.6)' : undefined,
              color: !isPublished ? 'var(--gold)' : undefined,
              background: !isPublished ? 'rgba(226,184,106,0.08)' : undefined,
            }}
            title="Save article as an unpublished draft"
          >
            <Ic k="file" s={15} sw={1.8} />
            {isPending && savingMode === 'draft' ? 'SAVING DRAFT…' : 'SAVE AS DRAFT'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="crm-btn pri"
            title="Publish article live to readers"
          >
            <Ic k="check" s={16} sw={2} />
            {isPending && savingMode === 'publish'
              ? 'PUBLISHING…'
              : isPublished
              ? 'SAVE & PUBLISH'
              : 'PUBLISH NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}
