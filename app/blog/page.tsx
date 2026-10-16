import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eyebrow } from '@/components/Bits';
import { getPublishedBlogs, getSite, getBooks, getAdSettings } from '@/lib/store';
import BlogArchiveClient from '@/components/blog/BlogArchiveClient';
import BlogFeaturedSpotlight from '@/components/blog/BlogFeaturedSpotlight';
import SidebarAdSlot from '@/components/ads/SidebarAdSlot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const [site, posts, books, adSettings] = await Promise.all([getSite(), getPublishedBlogs(), getBooks(), getAdSettings()]);
  const spotlightPosts = posts.filter((p) => p.featured);
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

        {/* Featured Post Spotlight (handles 1, 2, or multiple featured articles) */}
        {spotlightPosts.length > 0 && (
          <BlogFeaturedSpotlight posts={spotlightPosts} />
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
            <SidebarAdSlot position="left" book={leftBook} label="FEATURED NOVEL" adConfig={adSettings.leftAd} />
            <div className="blog-archive-main">
              <BlogArchiveClient posts={posts} />
            </div>
            <SidebarAdSlot position="right" book={rightBook} label="ADVERTISEMENT" adConfig={adSettings.rightAd} />
          </div>
        </main>

        <Footer site={site} />
      </div>
    </>
  );
}
