import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';

export default function Footer({ site }: { site: SiteSettings; hideSocial?: boolean }) {
  const findUrl = (name: string, fallback: string) => {
    const match = site.socialLinks?.find(
      (l) =>
        l.platform.toLowerCase() === name.toLowerCase() ||
        (name === 'X' && (l.platform.toLowerCase() === 'x' || l.platform.toLowerCase() === 'twitter'))
    );
    if (match?.url) return match.url;
    if (name.toLowerCase() === 'youtube' && site.youtubeUrl) return site.youtubeUrl;
    return fallback;
  };

  const igUrl = findUrl('Instagram', 'https://instagram.com');
  const fbUrl = findUrl('Facebook', 'https://facebook.com');
  const ytUrl = findUrl('YouTube', 'https://youtube.com');
  const ttUrl = findUrl('TikTok', 'https://tiktok.com');
  const xUrl = findUrl('X', 'https://x.com');

  return (
    <footer className="site-footer">
      <div className="km-grain abs" style={{ opacity: 0.5 }} />
      <div className="rule2" style={{ position: 'absolute', left: 0, right: 0, top: 0 }} />
      <div className="top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Ken Merrell" width={276} height={64} />
        <nav aria-label="Footer">
          <Link href="/books">BOOKS</Link>
          <Link href="/#coming">COMING SOON</Link>
          <Link href="/#videos">VIDEOS</Link>
          <Link href="/advance-readers">ADVANCE READERS</Link>
          <Link href="/author">ABOUT KEN</Link>
          <Link href="/#contact">CONTACT</Link>
        </nav>
      </div>

      <div className="bottom">
        <span>© {new Date().getFullYear()} Ken Merrell. All rights reserved.</span>
        <i>{site.pullQuote || 'What will I do when the pressure falls on me?'}</i>
      </div>

      {/* Artistic Vintage Social Handles Collage Strip */}
      <div className="footer-social-collage-wrap" aria-label="Social media channels">
        <div className="footer-social-collage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/footer-social-strip.png"
            alt="Follow Ken Merrell on Instagram, Facebook, YouTube, TikTok, and X"
            className="footer-social-collage-img"
            width={1024}
            height={210}
          />
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-hotspot hotspot-ig"
            title="Instagram · Ken Merrell"
            aria-label="Follow Ken Merrell on Instagram"
          />
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-hotspot hotspot-fb"
            title="Facebook · Ken Merrell"
            aria-label="Follow Ken Merrell on Facebook"
          />
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-hotspot hotspot-yt"
            title="YouTube · Ken Merrell"
            aria-label="Subscribe to Ken Merrell on YouTube"
          />
          <a
            href={ttUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-hotspot hotspot-tt"
            title="TikTok · Ken Merrell"
            aria-label="Follow Ken Merrell on TikTok"
          />
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-hotspot hotspot-x"
            title="X (Twitter) · Ken Merrell"
            aria-label="Follow Ken Merrell on X"
          />
        </div>
      </div>
    </footer>
  );
}
