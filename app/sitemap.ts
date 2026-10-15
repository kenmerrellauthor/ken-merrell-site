import type { MetadataRoute } from 'next';
import { getBooks, getPublishedBlogs } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const raw = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kenmerrell.com')?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const base = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const [books, blogs] = await Promise.all([getBooks(), getPublishedBlogs()]);

  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/books`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/author`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/advance-readers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ...books
      .filter((b) => Boolean(b.slug))
      .map((b) => ({
        url: `${base}/books/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: b.status === 'available' ? 0.8 : 0.7
      })),
    ...blogs
      .filter((b) => Boolean(b.slug))
      .map((b) => ({
        url: `${base}/blog/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : (b.publishedAt ? new Date(b.publishedAt) : new Date()),
        changeFrequency: 'weekly' as const,
        priority: b.featured ? 0.85 : 0.8
      }))
  ];
}

