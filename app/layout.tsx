import type { Metadata, Viewport } from 'next';
import '@fontsource/cinzel/latin-500.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import './globals.css';

function getSiteUrl(): URL {
  const envUrl = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kenmerrell.com')?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const raw = envUrl || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');
  try {
    const valid = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    return new URL(valid);
  } catch {
    return new URL('http://localhost:3000');
  }
}

const siteUrl = getSiteUrl().origin;

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: 'Ken Merrell · Author & Novelist', template: '%s · Ken Merrell' },
  description: 'The official website of novelist Ken Merrell. Discover published works, read sample chapters, explore audiobooks, and get early copies of upcoming novels.',
  keywords: ['Ken Merrell', 'novelist', 'author', 'historical fiction', 'suspense novels', 'thrillers', 'Petticoats and Ash', 'books', 'audiobooks', 'advance readers'],
  authors: [{ name: 'Ken Merrell' }],
  creator: 'Ken Merrell',
  publisher: 'Ken Merrell',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Ken Merrell',
    title: 'Ken Merrell · Author & Novelist',
    description: 'The official website of novelist Ken Merrell. Discover published works, read sample chapters, explore audiobooks, and get early copies of upcoming novels.',
    images: [{ url: '/img/banners/ash.jpg', width: 1200, height: 630, alt: 'Ken Merrell — Novelist' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ken Merrell · Author & Novelist',
    description: 'The official website of novelist Ken Merrell. Discover published works, read sample chapters, explore audiobooks, and get early copies of upcoming novels.',
    images: ['/img/banners/ash.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  icons: { icon: '/favicon.png' }
};

export const viewport: Viewport = { themeColor: '#0f0d0b', width: 'device-width', initialScale: 1 };

import { Suspense } from 'react';
import Tracker from '@/components/Tracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#author`,
        name: 'Ken Merrell',
        jobTitle: 'Author & Novelist',
        description: 'Novelist and author of historical fiction, thrillers, and suspense novels.',
        url: siteUrl
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Ken Merrell · Official Author Website',
        description: 'The official website of novelist Ken Merrell.',
        publisher: {
          '@id': `${siteUrl}/#author`
        }
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
