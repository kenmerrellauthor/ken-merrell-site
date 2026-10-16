import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eyebrow, Cover } from '@/components/Bits';
import { getBlogBySlug, getBooks, getPublishedBlogs, getSite, getAdSettings, incrementBlogViews } from '@/lib/store';
import BlogContentRenderer from '@/components/blog/BlogContentRenderer';
import BlogFaqAccordion from '@/components/blog/BlogFaqAccordion';
import BlogComments from '@/components/BlogComments';
import { parseYouTubeId } from '@/lib/youtube';
import BlogShareBar from '@/components/blog/BlogShareBar';
import MoreArticlesSection from '@/components/blog/MoreArticlesSection';
import SidebarAdSlot from '@/components/ads/SidebarAdSlot';
import { SocialIcon } from '@/components/icons';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPublishedBlogs();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post || !post.isPublished) {
    return { title: 'Post Not Found · Ken Merrell' };
  }

  const title = post.metaTitle || `${post.title} · Ken Merrell`;
  const description = post.metaDescription || post.excerpt;
  const canonicalUrl = post.canonicalUrl || `/blog/${post.slug}`;
  const images = post.coverImage ? [post.coverImage] : ['/img/banners/ash.jpg'];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName || 'Ken Merrell'],
      tags: post.tags,
      images: images.map((img) => ({ url: img, width: 1200, height: 630, alt: post.title })),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, site, books, adSettings, allPosts] = await Promise.all([
    getBlogBySlug(slug),
    getSite(),
    getBooks(),
    getAdSettings(),
    getPublishedBlogs(),
  ]);

  if (!post || !post.isPublished) {
    notFound();
  }

  // Related and more articles recommendation
  const otherPosts = allPosts.filter((p) => p.id !== post.id && p.slug !== post.slug);
  const currentTags = new Set(post.tags || []);
  const morePosts = [...otherPosts]
    .sort((a, b) => {
      const aCat = a.category === post.category ? 1 : 0;
      const bCat = b.category === post.category ? 1 : 0;
      if (aCat !== bCat) return bCat - aCat;

      const aTags = (a.tags || []).filter((t) => currentTags.has(t)).length;
      const bTags = (b.tags || []).filter((t) => currentTags.has(t)).length;
      if (aTags !== bTags) return bTags - aTags;

      const tA = new Date(a.publishedAt || a.updatedAt).getTime();
      const tB = new Date(b.publishedAt || b.updatedAt).getTime();
      return tB - tA;
    })
    .slice(0, 3);

  // Increment views in background (non-blocking)
  incrementBlogViews(post.id).catch(() => {});

  const relatedBook = post.relatedBookSlug
    ? books.find((b) => b.slug === post.relatedBookSlug)
    : null;

  const leftBook = books[0] || null;
  const rightBook = books.find((b) => b.slug !== leftBook?.slug && b.slug !== relatedBook?.slug) || books[1] || books[0] || null;

  const rawBase =
    (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kenmerrell.com')?.trim();
  const siteUrl = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`;
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  // Structured Data (JSON-LD) for Google & Generative Search Engines
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : [`${siteUrl}/img/banners/ash.jpg`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.authorName || 'Ken Merrell',
      url: `${siteUrl}/author`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ken Merrell',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/img/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    keywords: (post.tags || []).join(', '),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.category || 'Article',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: articleUrl,
      },
    ],
  };

  const faqSchema =
    post.faqItems && post.faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
        }
      : null;

  return (
    <>
      {/* Schema.org Rich Snippets JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div style={{ position: 'relative' }}>
        <Header active="blog" />

        <article
          style={{
            paddingTop: 'clamp(100px, 12vw, 140px)',
            paddingBottom: 80,
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
            position: 'relative',
          }}
        >
          <div className="km-grain abs" style={{ opacity: 0.35 }} />

          <div className="blog-reader-layout">
            {/* Left Sidebar Ad Rail */}
            <SidebarAdSlot position="left" book={leftBook} label="SPONSORED" adConfig={adSettings.leftAd} />

            {/* Central Article Column */}
            <div className="blog-reader-main">
              {/* Breadcrumb Navigation: Home / Blog / Category / Post */}
              <nav
                aria-label="Breadcrumb"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 20,
                  flexWrap: 'wrap',
                }}
              >
                <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                  Home
                </Link>
                <span>/</span>
                <Link href="/blog" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                  Blog
                </Link>
                {post.category && (
                  <>
                    <span>/</span>
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category)}`}
                      style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                    >
                      {post.category}
                    </Link>
                  </>
                )}
                <span>/</span>
                <span
                  style={{
                    color: 'var(--gold)',
                    maxWidth: 340,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                  }}
                  title={post.title}
                >
                  {post.title}
                </span>
              </nav>

            {/* Article Header */}
            <header style={{ marginBottom: 32 }}>
              {/* Category Eyebrow Pill */}
              {post.category && (
                <div style={{ marginBottom: 14 }}>
                  <Link
                    href={`/blog?category=${encodeURIComponent(post.category)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: '1px solid rgba(201, 168, 96, 0.4)',
                      background: 'linear-gradient(135deg, rgba(201, 168, 96, 0.15) 0%, rgba(201, 168, 96, 0.04) 100%)',
                      color: 'var(--gold)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>✦</span>
                    <span>{post.category}</span>
                  </Link>
                </div>
              )}

              <h1
                style={{
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: 'clamp(30px, 4.5vw, 48px)',
                  lineHeight: 1.2,
                  color: 'var(--cream)',
                  margin: '0 0 16px',
                  letterSpacing: '-0.02em',
                }}
              >
                {post.title}
              </h1>

              {/* Byline & Metadata */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: 13,
                  color: 'var(--muted)',
                  paddingBottom: 20,
                  borderBottom: '1px solid rgba(201, 168, 96, 0.2)',
                }}
              >
                <span style={{ color: 'var(--cream)' }}>
                  By <strong style={{ color: 'var(--gold)' }}>{post.authorName || 'Ken Merrell'}</strong>
                </span>
                <span>•</span>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span>•</span>
                <span>{post.readTimeMinutes} min read</span>
                {post.views !== undefined && post.views > 5 && (
                  <>
                    <span>•</span>
                    <span>{post.views.toLocaleString()} readers</span>
                  </>
                )}
              </div>

              {/* Top Quick Share Bar */}
              <BlogShareBar title={post.title} slug={post.slug} excerpt={post.excerpt} variant="inline" />
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div
                style={{
                  marginBottom: 36,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(201, 168, 96, 0.25)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.title}
                  style={{
                    width: '100%',
                    maxHeight: 520,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}


            {/* Featured Video Spotlight */}
            {post.videoUrl && parseYouTubeId(post.videoUrl) && (
              <div
                style={{
                  marginBottom: 36,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(201, 168, 96, 0.35)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                  background: '#0a0908',
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${parseYouTubeId(post.videoUrl)}`}
                    title={`${post.title} — Video Spotlight`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Main Article Body */}
            <BlogContentRenderer content={post.content} inArticleAd={adSettings.inArticleAd} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div
                style={{
                  marginTop: 48,
                  paddingTop: 24,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {post.category && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Category:
                    </span>
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category)}`}
                      style={{
                        background: 'rgba(201, 168, 96, 0.12)',
                        border: '1px solid rgba(201, 168, 96, 0.35)',
                        padding: '3px 10px',
                        borderRadius: 14,
                        fontSize: 11,
                        color: 'var(--gold)',
                        textDecoration: 'none',
                        fontFamily: 'var(--serif-c, "Cinzel", serif)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {post.category}
                    </Link>
                  </div>
                )}
                <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Topics:
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(201, 168, 96, 0.2)',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      color: 'var(--cream)',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share Card at the End of the Article */}
            <BlogShareBar title={post.title} slug={post.slug} excerpt={post.excerpt} variant="card" />

            {/* FAQ Accordion Section (GEO & User Value) */}
            {post.faqItems && post.faqItems.length > 0 && (
              <BlogFaqAccordion faqs={post.faqItems} />
            )}

            {/* Featured Book Showcase Card */}
            {relatedBook && (
              <section
                aria-label={`Featured Novel: ${relatedBook.title}`}
                className="blog-related-book-card"
                style={{
                  marginTop: 64,
                  padding: '36px 32px',
                  background: 'linear-gradient(135deg, rgba(32, 25, 18, 0.95) 0%, rgba(16, 13, 10, 0.98) 100%)',
                  border: '1px solid rgba(201, 168, 96, 0.4)',
                  borderRadius: 12,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 24px rgba(201, 168, 96, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle top gold accent line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)',
                  }}
                />

                {/* Book Cover with 3D Depth & Shadow */}
                <div
                  style={{
                    position: 'relative',
                    width: 120,
                    height: 180,
                    flexShrink: 0,
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '0 18px 36px rgba(0,0,0,0.7), 0 0 16px rgba(201, 168, 96, 0.2)',
                    border: '1px solid rgba(201, 168, 96, 0.45)',
                    background: '#15120f',
                  }}
                >
                  <Cover book={relatedBook} w={120} h={180} title={13} author={8} />
                  <div className="km-spine abs" />
                </div>

                {/* Book Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'var(--serif-c, "Cinzel", serif)',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--gold)',
                        fontWeight: 700,
                        background: 'rgba(201, 168, 96, 0.12)',
                        border: '1px solid rgba(201, 168, 96, 0.3)',
                        padding: '3px 10px',
                        borderRadius: 14,
                      }}
                    >
                      FEATURED NOVEL
                    </span>
                    <span style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: 2 }}>★★★★★</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                      Historical Suspense
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--serif, Georgia, serif)',
                      fontSize: 'clamp(22px, 2.4vw, 28px)',
                      color: 'var(--cream)',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {relatedBook.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: '#d4c8b6',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {relatedBook.tagline || relatedBook.description || 'Step into the unforgiving 1880s frontier with Ken Merrell’s signature suspense.'}
                  </p>

                  {/* Actions Row */}
                  <div
                    className="blog-related-book-actions"
                    style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}
                  >
                    <Link
                      href={`/books/${relatedBook.slug}`}
                      className="btn pri"
                      style={{
                        fontSize: 11,
                        padding: '10px 22px',
                        letterSpacing: '0.12em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>EXPLORE THE NOVEL</span>
                      <span>→</span>
                    </Link>

                    {relatedBook.amazonUrl && (
                      <a
                        href={relatedBook.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn sec"
                        style={{
                          fontSize: 11,
                          padding: '10px 20px',
                          letterSpacing: '0.12em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>BUY ON AMAZON</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Author Bio Showcase */}
            <section
              aria-label="About the Author: Ken Merrell"
              className="blog-author-bio-card"
              style={{
                marginTop: 48,
                padding: '32px 30px',
                background: 'linear-gradient(135deg, rgba(24, 20, 16, 0.95) 0%, rgba(14, 11, 9, 0.98) 100%)',
                border: '1px solid rgba(201, 168, 96, 0.35)',
                borderRadius: 12,
                boxShadow: '0 16px 45px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle gold accent indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 3,
                  background: 'linear-gradient(180deg, var(--gold) 0%, rgba(201, 168, 96, 0.2) 100%)',
                }}
              />

              {/* Author Portrait with Double Gold Ring Frame */}
              <Link
                href="/author"
                title="Ken Merrell — Author of Historical Suspense"
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 0 0 4px rgba(201, 168, 96, 0.15), 0 8px 24px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle, #2a2219 0%, #120f0c 100%)',
                  flexShrink: 0,
                  position: 'relative',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {site.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={site.photo}
                    alt="Ken Merrell"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: 'var(--gold)',
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      fontWeight: 700,
                      fontSize: 22,
                    }}
                  >
                    KM
                  </span>
                )}
              </Link>

              {/* Author Bio Content */}
              <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      color: 'var(--gold)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    ABOUT THE AUTHOR
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                    Utah, United States
                  </span>
                </div>

                <h4
                  style={{
                    margin: 0,
                    color: 'var(--cream)',
                    fontSize: 20,
                    fontFamily: 'var(--serif, Georgia, serif)',
                    lineHeight: 1.25,
                  }}
                >
                  Ken Merrell
                </h4>

                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#c4b9a7' }}>
                  Ken Merrell is an author of historical suspense fiction based in Utah. Drawing from authentic 19th-century territorial court records, journals, and forgotten voices, he crafts gripping human drama where every decision carries life-or-death consequences.
                </p>

                <div className="blog-author-bio-actions" style={{ marginTop: 6, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/author"
                    style={{
                      color: 'var(--gold)',
                      fontSize: 12,
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read Ken&apos;s Full Story</span>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/books"
                    style={{
                      color: 'var(--cream)',
                      fontSize: 11.5,
                      fontFamily: 'var(--serif-c, "Cinzel", serif)',
                      letterSpacing: '0.08em',
                      opacity: 0.8,
                      textDecoration: 'none',
                    }}
                  >
                    Explore Novels & Archives
                  </Link>
                </div>

                {/* Ken's Author Social Handles */}
                {site.socialLinks && site.socialLinks.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap', borderTop: '1px solid rgba(201, 168, 96, 0.15)', paddingTop: 12 }}>
                    <span
                      style={{
                        fontFamily: 'var(--serif-c, "Cinzel", serif)',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        color: 'var(--gold)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      FOLLOW KEN:
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {site.socialLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Follow Ken Merrell on ${link.platform}`}
                          aria-label={`Follow Ken Merrell on ${link.platform}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 14,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(201, 168, 96, 0.25)',
                            color: 'var(--cream)',
                            fontSize: 11,
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <SocialIcon platform={link.platform} s={13} />
                          <span>{link.platform}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* More Articles & Related Dispatches */}
            <MoreArticlesSection posts={morePosts} currentCategory={post.category} />

            {/* Reader Comments & Reflections Section */}
            <BlogComments
              blogId={post.id}
              blogSlug={post.slug}
              initialComments={post.comments || []}
            />

            {/* Back to Blog */}
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <Link
                href="/blog"
                style={{
                  color: 'var(--gold)',
                  fontFamily: 'var(--serif-c, "Cinzel", serif)',
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                ← Back to All Articles
              </Link>
            </div>
            </div>

            {/* Right Sidebar Ad Rail */}
            <SidebarAdSlot position="right" book={rightBook} label="ADVERTISEMENT" adConfig={adSettings.rightAd} />
          </div>
        </article>

        <Footer site={site} />
      </div>
    </>
  );
}
