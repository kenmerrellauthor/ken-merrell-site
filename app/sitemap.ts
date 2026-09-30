import type { MetadataRoute } from 'next';
import { getBooks } from '@/lib/store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const base = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const books = await getBooks();

  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/books`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/author`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/advance-readers`, changeFrequency: 'monthly', priority: 0.8 },
    ...books
      .filter((b) => b.status === 'available')
      .map((b) => ({
        url: `${base}/books/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }))
  ];
}

