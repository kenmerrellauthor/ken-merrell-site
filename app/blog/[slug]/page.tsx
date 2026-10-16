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
import SidebarAdSlot from '@/components/ads/SidebarAdSlot';
import { parseYouTubeId } from '@/lib/youtube';

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
  const [post, site, books, adSettings] = await Promise.all([
    getBlogBySlug(slug),
    getSite(),
    getBooks(),
    getAdSettings(),
  ]);

  if (!post || !post.isPublished) {
    notFound();
  }

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
            paddingTop: 140,
            paddingBottom: 100,
            paddingLeft: 'max(20px, env(safe-area-inset-left))',
            paddingRight: 'max(20px, env(safe-area-inset-right))',
            position: 'relative',
          }}
        >
          <div className="km-grain abs" style={{ opacity: 0.35 }} />

          <div className="blog-reader-layout">
            {/* Left Sidebar Ad Space */}
            <SidebarAdSlot position="left" book={leftBook} label="SPONSORED" adConfig={adSettings.leftAd} />

            {/* Central Article Column */}
            <div className="blog-reader-main">
            {/* Breadcrumb Navigation */}
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
              }}
            >
              <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                Blog
              </Link>
              <span>/</span>
              <span style={{ color: 'var(--gold)' }}>{post.category}</span>
            </nav>

            {/* Article Header */}
            <header style={{ marginBottom: 32 }}>
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

            {/* GEO Optimization Block: Key Takeaways */}
            {post.keyTakeaways && post.keyTakeaways.length > 0 && (
              <aside
                aria-label="Key Takeaways"
                style={{
                  background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.85) 0%, rgba(18, 15, 12, 0.95) 100%)',
                  border: '1px solid rgba(201, 168, 96, 0.4)',
                  borderLeft: '5px solid var(--gold)',
                  borderRadius: 6,
                  padding: '24px 28px',
                  marginBottom: 36,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontFamily: 'var(--serif-c, "Cinzel", serif)',
                    letterSpacing: '0.12em',
                    fontWeight: 700,
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  <span>⚡ KEY TAKEAWAYS</span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    color: '#ded3c1',
                    fontSize: 15,
                    lineHeight: 1.6,
                    fontFamily: 'var(--serif, Georgia, serif)',
                  }}
                >
                  {post.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx}>{takeaway}</li>
                  ))}
                </ul>
              </aside>
            )}

            {/* Excerpt Lead Paragraph */}
            {post.excerpt && (
              <p
                style={{
                  fontSize: 'clamp(18px, 1.4vw, 21px)',
                  lineHeight: 1.7,
                  color: '#e2d7c5',
                  fontStyle: 'italic',
                  marginBottom: 36,
                  paddingBottom: 24,
                  borderBottom: '1px solid rgba(201, 168, 96, 0.15)',
                }}
              >
                {post.excerpt}
              </p>
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

            {/* FAQ Accordion Section (GEO & User Value) */}
            {post.faqItems && post.faqItems.length > 0 && (
              <BlogFaqAccordion faqs={post.faqItems} />
            )}

            {/* Related Book CTA Card (Conversion Driver) */}
            {relatedBook && (
              <section
                aria-label={`Featured Book: ${relatedBook.title}`}
                style={{
                  marginTop: 56,
                  padding: 28,
                  background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.95) 0%, rgba(14, 12, 10, 0.98) 100%)',
                  border: '1px solid rgba(201, 168, 96, 0.35)',
                  borderRadius: 8,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  gap: 24,
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative', width: 90, height: 135 }}>
                  <Cover book={relatedBook} w={90} h={135} title={12} author={7} />
                  <div className="km-spine abs" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                    FEATURED NOVEL BY KEN MERRELL
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--serif, Georgia, serif)',
                      fontSize: 22,
                      color: 'var(--cream)',
                      lineHeight: 1.25,
                    }}
                  >
                    {relatedBook.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#c4b8a5' }}>
                    {relatedBook.tagline || relatedBook.description?.slice(0, 180) + '...'}
                  </p>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <Link
                      href={`/books/${relatedBook.slug}`}
                      className="btn pri"
                      style={{ fontSize: 11, padding: '8px 18px', letterSpacing: '0.1em' }}
                    >
                      EXPLORE THE BOOK
                    </Link>
                    {relatedBook.amazonUrl && (
                      <a
                        href={relatedBook.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn sec"
                        style={{ fontSize: 11, padding: '8px 16px', letterSpacing: '0.1em' }}
                      >
                        BUY ON AMAZON ↗
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Author Bio Box */}
            <section
              style={{
                marginTop: 48,
                padding: 24,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/author"
                title="Ken Merrell — About the Author"
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  border: '2px solid var(--gold)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle, #2a2219 0%, #120f0c 100%)',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  position: 'relative',
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
                      fontSize: 18,
                    }}
                  >
                    KM
                  </span>
                )}
              </Link>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  About the Author
                </div>
                <h4 style={{ margin: '2px 0 6px', color: 'var(--cream)', fontSize: 16, fontFamily: 'var(--serif, Georgia, serif)' }}>
                  Ken Merrell
                </h4>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#b8ad9e' }}>
                  Ken Merrell is an author of historical suspense fiction based in Utah, bringing authentic frontier records and gripping human drama to life.
                </p>
                <div style={{ marginTop: 8 }}>
                  <Link href="/author" style={{ color: 'var(--gold)', fontSize: 12, textDecoration: 'underline' }}>
                    Read Ken&apos;s Full Story →
                  </Link>
                </div>
              </div>
            </section>

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

            {/* Right Sidebar Ad Space */}
            <SidebarAdSlot position="right" book={rightBook} label="ADVERTISEMENT" adConfig={adSettings.rightAd} />
          </div>
        </article>

        <Footer site={site} />
      </div>
    </>
  );
}
