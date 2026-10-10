import { NextResponse } from 'next/server';
import { recordIncomingEvent } from '@/lib/analytics';

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
      ...body,
      device: body.device || device,
      browser: body.browser || browser,
      city: body.city || city,
      region: body.region || region,
      country: body.country || country,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
