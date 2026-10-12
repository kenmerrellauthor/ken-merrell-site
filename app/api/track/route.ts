import { NextResponse } from 'next/server';
import { recordIncomingEvent } from '@/lib/analytics';

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 16_384) {
      return NextResponse.json({ ok: false, error: 'Tracking payload is too large.' }, { status: 413 });
    }
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid tracking payload.' }, { status: 400 });
    }
    const allowedEvents = new Set(['pageview', 'amazon_click', 'video_play', 'arc_signup', 'scroll_quote']);
    if (!allowedEvents.has(body.eventType) || typeof body.pagePath !== 'string' || !body.pagePath.startsWith('/')) {
      return NextResponse.json({ ok: false, error: 'Invalid tracking event.' }, { status: 400 });
    }
    const cleanText = (value: unknown, max = 500) => typeof value === 'string' ? value.slice(0, max) : undefined;

    // Inspect server headers for location and user-agent if available
    const userAgent = req.headers.get('user-agent') || '';
    let device = 'Desktop';
    let browser = 'Browser';

    if (/iphone/i.test(userAgent)) device = 'iPhone';
    else if (/ipad/i.test(userAgent)) device = 'iPad';
    else if (/android/i.test(userAgent)) device = 'Android';
    else if (/macintosh/i.test(userAgent)) device = 'Mac';
    else if (/windows/i.test(userAgent)) device = 'Windows';

    if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = 'Safari';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/edg/i.test(userAgent)) browser = 'Edge';

    const city = req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity') || undefined;
    const region = req.headers.get('x-vercel-ip-country-region') || req.headers.get('cf-region') || undefined;
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || undefined;

    const result = await recordIncomingEvent({
      sessionId: cleanText(body.sessionId, 100),
      eventType: body.eventType,
      pagePath: body.pagePath.slice(0, 1000),
      pageTitle: cleanText(body.pageTitle),
      bookTitle: cleanText(body.bookTitle),
      targetUrl: cleanText(body.targetUrl, 2000),
      details: cleanText(body.details),
      utmSource: cleanText(body.utmSource, 200),
      utmMedium: cleanText(body.utmMedium, 100),
      utmCampaign: cleanText(body.utmCampaign, 300),
      utmContent: cleanText(body.utmContent, 300),
      adClickId: cleanText(body.adClickId, 300),
      adClickSource: cleanText(body.adClickSource, 80),
      referrer: cleanText(body.referrer, 2000),
      device: device,
      browser: browser,
      city: city,
      region: region,
      country: country,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('Analytics tracking request failed:', err);
    return NextResponse.json({ ok: false, error: 'Analytics could not save this event.' }, { status: 503 });
  }
}
