import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const base = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const disallow = ['/admin', '/admin/', '/api/admin', '/api/admin/'];

  return {
    rules: [
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Applebot',
          'ClaudeBot',
          '*'
        ],
        allow: '/',
        disallow
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}

