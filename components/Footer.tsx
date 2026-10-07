import Link from 'next/link';
import { SocialIcon } from './icons';
import type { SiteSettings } from '@/lib/types';

export default function Footer({ site }: { site: SiteSettings }) {
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
        {(site.amazonAuthorUrl || site.youtubeUrl || (site.socialLinks && site.socialLinks.length > 0)) && (
          <div className="links">
            {site.youtubeUrl && (
              <a href={site.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn-social" title="YouTube">
                <SocialIcon platform="YouTube" s={18} />
              </a>
            )}
            {site.amazonAuthorUrl && (
              <a href={site.amazonAuthorUrl} target="_blank" rel="noopener noreferrer" className="btn-social" title="Amazon">
                <SocialIcon platform="Amazon" s={18} />
              </a>
            )}
            {site.socialLinks?.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="btn-social" title={link.platform}>
                <SocialIcon platform={link.platform} s={18} />
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="bottom">
        <span>© {new Date().getFullYear()} Ken Merrell. All rights reserved.</span>
        <i>{site.pullQuote || 'What will I do when the pressure falls on me?'}</i>
      </div>
    </footer>
  );
}
