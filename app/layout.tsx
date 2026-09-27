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
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const raw = envUrl || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');
  try {
    const valid = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    return new URL(valid);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: 'Ken Merrell · Author', template: '%s · Ken Merrell' },
  description: 'The official website of novelist Ken Merrell. Every book in one place, with sample chapters, Amazon and Audible links, and early copies for advance readers.',
  openGraph: { type: 'website', siteName: 'Ken Merrell', images: ['/img/banners/ash.jpg'] },
  icons: { icon: '/favicon.png' }
};

export const viewport: Viewport = { themeColor: '#0f0d0b', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
