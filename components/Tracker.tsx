'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Only run on client and ignore admin routes from ad tracking
    if (typeof window === 'undefined') return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // Get or initialize session ID
    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('km_session_id') || '';
      if (!sessionId) {
        sessionId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
        sessionStorage.setItem('km_session_id', sessionId);
      }
    } catch {
      sessionId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Check for UTM parameters
    let utmSource = searchParams.get('utm_source') || '';
    let utmMedium = searchParams.get('utm_medium') || '';
    let utmCampaign = searchParams.get('utm_campaign') || '';
    let utmContent = searchParams.get('utm_content') || '';

    // Cache UTM parameters for the session
    try {
      if (utmSource) sessionStorage.setItem('km_utm_source', utmSource);
      else utmSource = sessionStorage.getItem('km_utm_source') || '';

      if (utmMedium) sessionStorage.setItem('km_utm_medium', utmMedium);
      else utmMedium = sessionStorage.getItem('km_utm_medium') || '';

      if (utmCampaign) sessionStorage.setItem('km_utm_campaign', utmCampaign);
      else utmCampaign = sessionStorage.getItem('km_utm_campaign') || '';

      if (utmContent) sessionStorage.setItem('km_utm_content', utmContent);
      else utmContent = sessionStorage.getItem('km_utm_content') || '';
    } catch {
      /* ignore storage block */
    }

    const currentFull = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    if (lastPath.current === currentFull) return;
    lastPath.current = currentFull;

    // Send pageview
    try {
      const payload = {
        sessionId,
        eventType: 'pageview',
        pagePath: pathname,
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        utmContent: utmContent || undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      };

      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* silently ignore network */
    }
  }, [pathname, searchParams]);

  // Click listeners for Outbound Amazon clicks and Video trailer clicks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // 1. Check for Amazon Outbound Clicks
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (anchor && anchor.href && (anchor.href.includes('amazon.com') || anchor.href.includes('amzn.to') || anchor.dataset.track === 'amazon')) {
        let sessionId = '';
        try {
          sessionId = sessionStorage.getItem('km_session_id') || '';
        } catch {
          /* ignore */
        }

        // Try to identify which book they are buying
        let bookTitle = anchor.dataset.bookTitle || '';
        if (!bookTitle) {
          const container = anchor.closest('[data-book-title], article, section, .book-detail, .cubby, .cs-section');
          if (container) {
            bookTitle = (container as HTMLElement).dataset?.bookTitle || '';
            if (!bookTitle) {
              const h = container.querySelector('h1, h2, h3, .title');
              if (h) bookTitle = h.textContent?.trim() || '';
            }
          }
        }
        if (!bookTitle && typeof document !== 'undefined') {
          const mainH1 = document.querySelector('h1');
          if (mainH1) bookTitle = mainH1.textContent?.trim() || '';
        }

        const payload = {
          sessionId,
          eventType: 'amazon_click',
          pagePath: window.location.pathname,
          bookTitle: bookTitle || 'Ken Merrell Book on Amazon',
          targetUrl: anchor.href,
          details: `*** CLICKED "BUY ON AMAZON" BUTTON *** (${bookTitle || 'Book'})`,
        };

        try {
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
          } else {
            fetch('/api/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              keepalive: true,
            }).catch(() => {});
          }
        } catch {
          /* ignore */
        }
      }

      // 2. Check for Book Trailer Video plays
      const videoBtn = target.closest('button, a, .vcard, .vplay') as HTMLElement | null;
      if (videoBtn && (videoBtn.dataset.video || videoBtn.closest('.videos, .video-grid, .video-player'))) {
        let sessionId = '';
        try {
          sessionId = sessionStorage.getItem('km_session_id') || '';
        } catch {
          /* ignore */
        }

        const titleEl = videoBtn.closest('.vcard')?.querySelector('.vt') || videoBtn.querySelector('.vt');
        const videoTitle = titleEl?.textContent?.trim() || 'Book Trailer Video';

        const payload = {
          sessionId,
          eventType: 'video_play',
          pagePath: window.location.pathname,
          details: `Clicked to play video: "${videoTitle}"`,
        };

        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  return null;
}
