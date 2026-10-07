import type { MetadataRoute } from 'next';
import { getBooks } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const raw = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kenmerrell.com')?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const base = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const books = await getBooks();

  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/books`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/author`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/advance-readers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ...books
      .filter((b) => Boolean(b.slug))
      .map((b) => ({
        url: `${base}/books/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: b.status === 'available' ? 0.8 : 0.7
      }))
  ];
}

