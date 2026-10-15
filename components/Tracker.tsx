'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const AD_CLICK_PARAMS: Array<[string, string]> = [
  ['fbclid', 'Meta'],
  ['ttclid', 'TikTok'],
  ['gclid', 'Google'],
  ['gbraid', 'Google'],
  ['wbraid', 'Google'],
  ['msclkid', 'Microsoft Ads'],
  ['li_fat_id', 'LinkedIn'],
  ['epik', 'Pinterest'],
  ['twclid', 'X'],
  ['rdt_cid', 'Reddit'],
];
function createVisitorId() {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `USR-${uuid}`;
}
type MetaWindow = Window & { fbq?: (...args: any[]) => void; _fbq?: (...args: any[]) => void };

function trackMeta(event: string, params?: Record<string, string>, custom = false) {
  try {
    if (localStorage.getItem('km_marketing_consent') !== 'accepted') return;
    const fbq = (window as MetaWindow).fbq;
    if (fbq) fbq(custom ? 'trackCustom' : 'track', event, params);
  } catch {
    /* ignore blocked storage */
  }
}

function initializeMetaPixel(pixelId: string) {
  const w = window as MetaWindow;
  if (w.fbq) return;

  const fbq: any = function (...args: any[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  w.fbq = fbq;
  w._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', pixelId);
}

export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const lastMetaPath = useRef<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState<'accepted' | 'declined' | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    try {
      const saved = localStorage.getItem('km_marketing_consent');
      if (saved === 'accepted' || saved === 'declined') setMarketingConsent(saved);
      else setShowConsent(true);
    } catch {
      setShowConsent(true);
    }
  }, []);

  useEffect(() => {
    if (!META_PIXEL_ID || marketingConsent !== 'accepted') return;
    initializeMetaPixel(META_PIXEL_ID);

    const query = searchParams.toString();
    const pageKey = pathname + (query ? `?${query}` : '');
    if (lastMetaPath.current === pageKey) return;
    lastMetaPath.current = pageKey;
    trackMeta('PageView');

    if (pathname.startsWith('/books/')) {
      trackMeta('ViewContent', {
        content_name: document.title.slice(0, 100),
        content_type: 'product',
      });
    }
  }, [marketingConsent, pathname, searchParams]);

  useEffect(() => {
    if (!META_PIXEL_ID || marketingConsent !== 'accepted') return;
    const handleLead = () => trackMeta('Lead', { content_name: 'Advance Reader signup' });
    window.addEventListener('km:meta-lead', handleLead);
    return () => window.removeEventListener('km:meta-lead', handleLead);
  }, [marketingConsent]);

  useEffect(() => {
    // Only run on client and ignore admin routes from ad tracking
    if (typeof window === 'undefined') return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // Check for UTM parameters
    let utmSource = searchParams.get('utm_source') || '';
    let utmMedium = searchParams.get('utm_medium') || '';
    let utmCampaign = searchParams.get('utm_campaign') || '';
    let utmContent = searchParams.get('utm_content') || '';
    let adClickId = '';
    let adClickSource = '';

    for (const [parameter, platform] of AD_CLICK_PARAMS) {
      const value = searchParams.get(parameter);
      if (value) {
        adClickId = value.slice(0, 300);
        adClickSource = platform;
        break;
      }
    }

    const hasNewCampaign = Boolean(utmSource || utmCampaign || utmMedium || adClickId);

    // Get or initialize session ID
    let sessionId = '';
    try {
      const prevSource = sessionStorage.getItem('km_utm_source') || '';
      const prevCampaign = sessionStorage.getItem('km_utm_campaign') || '';
      sessionId = sessionStorage.getItem('km_session_id') || '';

      // Starting a new session if arriving with campaign parameters or if no session yet
      if (!sessionId || (hasNewCampaign && (utmCampaign !== prevCampaign || utmSource !== prevSource))) {
        sessionId = createVisitorId();
        sessionStorage.setItem('km_session_id', sessionId);
      }
    } catch {
      sessionId = createVisitorId();
    }

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

      if (adClickId) {
        sessionStorage.setItem('km_ad_click_id', adClickId);
        sessionStorage.setItem('km_ad_click_source', adClickSource);
      } else {
        adClickId = sessionStorage.getItem('km_ad_click_id') || '';
        adClickSource = sessionStorage.getItem('km_ad_click_source') || '';
      }
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
        adClickId: adClickId || undefined,
        adClickSource: adClickSource || undefined,
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

        trackMeta('AmazonOutboundClick', { content_name: bookTitle || 'Ken Merrell book' }, true);

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
        trackMeta('WatchVideo', { content_name: videoTitle }, true);

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

  if (!META_PIXEL_ID || !showConsent) return null;

  const chooseConsent = (choice: 'accepted' | 'declined') => {
    try {
      localStorage.setItem('km_marketing_consent', choice);
    } catch {
      /* keep the choice for this page view even if storage is blocked */
    }
    setMarketingConsent(choice);
    setShowConsent(false);
  };

  return (
    <aside className="marketing-consent" role="dialog" aria-label="Marketing tracking preferences">
      <div>
        <strong>Help us understand which campaigns bring readers here</strong>
        <p>Optional Meta marketing measurement records page and signup events. Your email address is not sent to Meta.</p>
      </div>
      <div className="marketing-consent-actions">
        <button type="button" className="marketing-consent-decline" onClick={() => chooseConsent('declined')}>No thanks</button>
        <button type="button" className="marketing-consent-accept" onClick={() => chooseConsent('accepted')}>Allow</button>
      </div>
    </aside>
  );
}
