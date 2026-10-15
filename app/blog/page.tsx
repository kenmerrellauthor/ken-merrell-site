import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eyebrow } from '@/components/Bits';
import { getPublishedBlogs, getSite, getBooks } from '@/lib/store';
import BlogArchiveClient from '@/components/blog/BlogArchiveClient';
import SidebarAdSlot from '@/components/ads/SidebarAdSlot';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog & Historical Essays · Behind the Frontier | Ken Merrell',
  description:
    'Explore in-depth historical essays, frontier archives, character studies, and writing craft notes by historical suspense author Ken Merrell.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog & Historical Essays · Ken Merrell',
    description:
      'Explore in-depth historical essays, frontier archives, character studies, and writing craft notes by historical suspense author Ken Merrell.',
    url: '/blog',
    type: 'website',
    images: [{ url: '/img/banners/ash.jpg', width: 1200, height: 630, alt: 'Ken Merrell Historical Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Historical Essays · Ken Merrell',
    description:
      'Explore in-depth historical essays, frontier archives, character studies, and writing craft notes by historical suspense author Ken Merrell.',
    images: ['/img/banners/ash.jpg'],
  },
};

export default async function BlogIndexPage() {
  const [site, posts, books] = await Promise.all([getSite(), getPublishedBlogs(), getBooks()]);
  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const otherPosts = featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts;
  const leftBook = books[0] || null;
  const rightBook = books[1] || books[0] || null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Header active="blog" />

        {/* Hero Section */}
        <section
          className="blog-hero"
          style={{
            paddingTop: 160,
            paddingBottom: 60,
            paddingLeft: 'var(--pad)',
            paddingRight: 'var(--pad)',
            position: 'relative',
            background: 'radial-gradient(ellipse at top center, rgba(35, 28, 20, 0.7) 0%, rgba(10, 9, 8, 1) 75%)',
          }}
        >
          <div className="km-hero-scrim abs" />
          <div className="km-grain abs" style={{ opacity: 0.4 }} />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1200,
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Eyebrow text="AUTHOR ARCHIVES & ESSAYS" />
            <h1
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: 'clamp(32px, 5vw, 56px)',
                lineHeight: 1.15,
                color: 'var(--cream)',
                margin: 0,
                letterSpacing: '-0.02em',
                maxWidth: 820,
              }}
            >
              Behind the Frontier
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 1.8vw, 18px)',
                lineHeight: 1.6,
                color: '#c4b8a5',
                maxWidth: 680,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              Archival research, historical mysteries, character dilemmas, and writing craft behind the historical novels of Ken Merrell.
            </p>
          </div>
        </section>

        {/* Featured Post Spotlight (if exists) */}
        {featuredPost && (
          <section
            style={{
              paddingLeft: 'var(--pad)',
              paddingRight: 'var(--pad)',
              paddingBottom: 40,
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(28, 23, 18, 0.9) 0%, rgba(14, 12, 10, 0.95) 100%)',
                border: '1px solid rgba(201, 168, 96, 0.35)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  alignItems: 'center',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280, background: '#1c1712' }}>
                  {featuredPost.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold)',
                        fontFamily: 'var(--serif-c, "Cinzel", serif)',
                        letterSpacing: '0.12em',
                      }}
                    >
                      FEATURED ARTICLE
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      background: 'rgba(201, 168, 96, 0.25)',
                      border: '1px solid var(--gold)',
                      color: 'var(--gold)',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    ★ FEATURED ARTICLE
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <span>{featuredPost.category}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--muted)' }}>{featuredPost.readTimeMinutes} min read</span>
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--serif, Georgia, serif)',
                      fontSize: 'clamp(24px, 2.5vw, 32px)',
                      color: 'var(--cream)',
                      lineHeight: 1.25,
                    }}
                  >
                    <Link href={`/blog/${featuredPost.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#c4b8a5' }}>
                    {featuredPost.excerpt}
                  </p>

                  {/* Highlights */}
                  {featuredPost.keyTakeaways && featuredPost.keyTakeaways.length > 0 && (
                    <div style={{ padding: '10px 14px', background: 'rgba(201, 168, 96, 0.08)', borderLeft: '3px solid var(--gold)', borderRadius: 3, fontSize: 12, color: '#ded3c1' }}>
                      <b style={{ color: 'var(--gold)' }}>Key Insight:</b> {featuredPost.keyTakeaways[0]}
                    </div>
                  )}

                  <div style={{ paddingTop: 8 }}>
                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="btn pri"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        fontSize: 12,
                        letterSpacing: '0.12em',
                      }}
                    >
                      READ FULL ESSAY →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Archive Grid flanked by Left & Right Ad Rails */}
        <main
          style={{
            paddingLeft: 'max(20px, env(safe-area-inset-left))',
            paddingRight: 'max(20px, env(safe-area-inset-right))',
            paddingTop: 40,
            paddingBottom: 100,
            maxWidth: 1540,
            margin: '0 auto',
          }}
        >
          <div className="blog-archive-layout">
            <SidebarAdSlot position="left" book={leftBook} label="FEATURED NOVEL" />
            <div className="blog-archive-main">
              <BlogArchiveClient posts={posts} />
            </div>
            <SidebarAdSlot position="right" book={rightBook} label="ADVERTISEMENT" />
          </div>
        </main>

        <Footer site={site} />
      </div>
    </>
  );
}
