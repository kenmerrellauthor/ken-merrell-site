import type { AnalyticsSession, AnalyticsEvent } from './types';

export function generateSeedAnalytics(): { sessions: AnalyticsSession[]; events: AnalyticsEvent[] } {
  const sessions: AnalyticsSession[] = [
    {
      id: 'USR-8422',
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins ago
      updatedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      durationSeconds: 252,
      source: 'Instagram',
      medium: 'paid_ad',
      campaign: 'book_trailer_v2',
      content: 'cinematic_teaser_9x16',
      location: { city: 'Austin', region: 'Texas', country: 'United States' },
      device: 'iPhone',
      browser: 'Safari',
      landingPage: '/books/petticoats-and-ash',
      referrer: 'https://instagram.com',
      exitOutcome: 'amazon_click',
      outcomeDetail: 'Petticoats and Ash',
      pageCount: 3,
    },
    {
      id: 'USR-8421',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
      durationSeconds: 215,
      source: 'Facebook',
      medium: 'paid_ad',
      campaign: 'spring_promo',
      content: 'quote_card_ash',
      location: { city: 'London', region: 'England', country: 'United Kingdom' },
      device: 'Windows',
      browser: 'Chrome',
      landingPage: '/advance-readers',
      referrer: 'https://facebook.com',
      exitOutcome: 'arc_signup',
      outcomeDetail: 'John Davies (Paperback ARC)',
      readerName: 'John Davies',
      readerEmail: 'john.davies.uk@example.com',
      pageCount: 2,
    },
    {
      id: 'USR-8420',
      createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
      durationSeconds: 38,
      source: 'Google',
      medium: 'search',
      campaign: '(organic)',
      location: { city: 'Chicago', region: 'Illinois', country: 'United States' },
      device: 'Android',
      browser: 'Chrome',
      landingPage: '/',
      referrer: 'https://www.google.com',
      exitOutcome: 'exit',
      pageCount: 1,
    },
    {
      id: 'USR-8419',
      createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      durationSeconds: 340,
      source: 'BookBub',
      medium: 'cpc',
      campaign: 'may_deal',
      content: 'historical_fiction_spotlight',
      location: { city: 'Toronto', region: 'Ontario', country: 'Canada' },
      device: 'iPad',
      browser: 'Safari',
      landingPage: '/books/petticoats-and-a-traitors-death',
      referrer: 'https://bookbub.com',
      exitOutcome: 'amazon_click',
      outcomeDetail: "Petticoats and a Traitor's Death",
      pageCount: 4,
    },
    {
      id: 'USR-8418',
      createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      durationSeconds: 290,
      source: 'Instagram',
      medium: 'organic_bio',
      campaign: 'profile_bio',
      location: { city: 'Seattle', region: 'Washington', country: 'United States' },
      device: 'iPhone',
      browser: 'Safari',
      landingPage: '/',
      referrer: 'https://instagram.com',
      exitOutcome: 'arc_signup',
      outcomeDetail: 'Sarah Jenkins (Ebook ARC)',
      readerName: 'Sarah Jenkins',
      readerEmail: 'sarah.j.books@example.com',
      pageCount: 3,
    },
    {
      id: 'USR-8417',
      createdAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 124 * 60 * 1000).toISOString(),
      durationSeconds: 310,
      source: 'Email',
      medium: 'newsletter',
      campaign: 'reader_recruitment',
      location: { city: 'Melbourne', region: 'Victoria', country: 'Australia' },
      device: 'Mac',
      browser: 'Safari',
      landingPage: '/advance-readers',
      referrer: 'https://mail.google.com',
      exitOutcome: 'arc_signup',
      outcomeDetail: 'Claire Thompson (Ebook ARC)',
      readerName: 'Claire Thompson',
      readerEmail: 'claire.t.reader@example.com',
      pageCount: 2,
    },
    {
      id: 'USR-8416',
      createdAt: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
      durationSeconds: 280,
      source: 'Instagram',
      medium: 'paid_ad',
      campaign: 'spring_promo_trail',
      content: 'carousel_cards_book1',
      location: { city: 'Atlanta', region: 'Georgia', country: 'United States' },
      device: 'iPhone',
      browser: 'Safari',
      landingPage: '/books/petticoats-and-ash',
      referrer: 'https://instagram.com',
      exitOutcome: 'amazon_click',
      outcomeDetail: 'Petticoats and Ash',
      pageCount: 3,
    },
    {
      id: 'USR-8415',
      createdAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 206 * 60 * 1000).toISOString(),
      durationSeconds: 240,
      source: 'TikTok',
      medium: 'organic_bio',
      campaign: 'viral_reel_teaser',
      location: { city: 'Denver', region: 'Colorado', country: 'United States' },
      device: 'Android',
      browser: 'Chrome',
      landingPage: '/books/of-craven-dawn',
      referrer: 'https://tiktok.com',
      exitOutcome: 'amazon_click',
      outcomeDetail: 'Of Craven Dawn',
      pageCount: 2,
    },
    {
      id: 'USR-8414',
      createdAt: new Date(Date.now() - 260 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 256 * 60 * 1000).toISOString(),
      durationSeconds: 220,
      source: 'Facebook',
      medium: 'paid_ad',
      campaign: 'spring_launch',
      content: 'trailer_feed_ad',
      location: { city: 'Dublin', region: 'Leinster', country: 'Ireland' },
      device: 'Windows',
      browser: 'Edge',
      landingPage: '/',
      referrer: 'https://facebook.com',
      exitOutcome: 'video_play',
      outcomeDetail: 'Watched Book Trailer (1m 40s)',
      pageCount: 2,
    },
    {
      id: 'USR-8413',
      createdAt: new Date(Date.now() - 310 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 308 * 60 * 1000).toISOString(),
      durationSeconds: 110,
      source: 'Direct',
      medium: 'direct',
      campaign: '(direct)',
      location: { city: 'Boston', region: 'Massachusetts', country: 'United States' },
      device: 'Mac',
      browser: 'Chrome',
      landingPage: '/author',
      exitOutcome: 'browse',
      pageCount: 2,
    },
    {
      id: 'USR-8412',
      createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 355 * 60 * 1000).toISOString(),
      durationSeconds: 305,
      source: 'BookBub',
      medium: 'cpc',
      campaign: 'may_deal',
      content: 'author_feature_cta',
      location: { city: 'Edinburgh', region: 'Scotland', country: 'United Kingdom' },
      device: 'iPad',
      browser: 'Safari',
      landingPage: '/books/petticoats-and-ash',
      referrer: 'https://bookbub.com',
      exitOutcome: 'amazon_click',
      outcomeDetail: 'Petticoats and Ash',
      pageCount: 3,
    },
  ];

  const events: AnalyticsEvent[] = [
    // USR-8422 Journey (The featured clickstream)
    {
      id: 'EVT-101',
      sessionId: 'USR-8422',
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash · Ken Merrell',
      bookTitle: 'Petticoats and Ash',
      details: 'Landed from Instagram Story Ad (Campaign: book_trailer_v2)',
    },
    {
      id: 'EVT-102',
      sessionId: 'USR-8422',
      timestamp: new Date(Date.now() - (17 * 60 + 25) * 1000).toISOString(),
      eventType: 'video_play',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash',
      bookTitle: 'Petticoats and Ash',
      details: 'Watched Book Trailer (played 1m 15s)',
    },
    {
      id: 'EVT-103',
      sessionId: 'USR-8422',
      timestamp: new Date(Date.now() - (16 * 60) * 1000).toISOString(),
      eventType: 'scroll_quote',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash',
      bookTitle: 'Petticoats and Ash',
      details: 'Read Editorial Reviews & Sample Chapter scene',
    },
    {
      id: 'EVT-104',
      sessionId: 'USR-8422',
      timestamp: new Date(Date.now() - (15 * 60 + 10) * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/author',
      pageTitle: 'About Ken Merrell · Novelist',
      details: 'Navigated to Author Bio (spent 1m 20s reading)',
    },
    {
      id: 'EVT-105',
      sessionId: 'USR-8422',
      timestamp: new Date(Date.now() - (14 * 60 + 20) * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash',
      bookTitle: 'Petticoats and Ash',
      details: 'Returned to book page to purchase',
    },
    {
      id: 'EVT-106',
      sessionId: 'USR-8422',
      timestamp: new Date(Date.now() - (14 * 60 + 8) * 1000).toISOString(),
      eventType: 'amazon_click',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash',
      bookTitle: 'Petticoats and Ash',
      details: '*** CLICKED "BUY ON AMAZON" BUTTON *** Outbound redirect to Amazon Product Page',
      targetUrl: 'https://www.amazon.com/dp/B0DJ8R1CWS',
    },

    // USR-8421 Journey (ARC Signup)
    {
      id: 'EVT-201',
      sessionId: 'USR-8421',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/advance-readers',
      pageTitle: 'Become an Advance Reader · Ken Merrell',
      details: 'Landed directly from Facebook Spring Ad (Campaign: spring_promo)',
    },
    {
      id: 'EVT-202',
      sessionId: 'USR-8421',
      timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash',
      bookTitle: 'Petticoats and Ash',
      details: 'Checked book description and premise',
    },
    {
      id: 'EVT-203',
      sessionId: 'USR-8421',
      timestamp: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
      eventType: 'arc_signup',
      pagePath: '/advance-readers',
      pageTitle: 'Become an Advance Reader',
      details: '*** SUBMITTED ADVANCE READER APPLICATION *** [Reader: John Davies | Format: Paperback | Book: Petticoats and Ash]',
    },

    // USR-8419 Journey (BookBub Deal Amazon Click)
    {
      id: 'EVT-301',
      sessionId: 'USR-8419',
      timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/books/petticoats-and-a-traitors-death',
      pageTitle: "Petticoats and a Traitor's Death · Ken Merrell",
      bookTitle: "Petticoats and a Traitor's Death",
      details: 'Landed from BookBub Featured Deal promo',
    },
    {
      id: 'EVT-302',
      sessionId: 'USR-8419',
      timestamp: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/books/petticoats-and-ash',
      pageTitle: 'Petticoats and Ash',
      bookTitle: 'Petticoats and Ash',
      details: 'Checked prequel book first',
    },
    {
      id: 'EVT-303',
      sessionId: 'USR-8419',
      timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      eventType: 'amazon_click',
      pagePath: '/books/petticoats-and-a-traitors-death',
      pageTitle: "Petticoats and a Traitor's Death",
      bookTitle: "Petticoats and a Traitor's Death",
      details: '*** CLICKED "BUY ON AMAZON" BUTTON ***',
      targetUrl: 'https://www.amazon.com/dp/B0DK9S8C1Z',
    },

    // USR-8418 Journey (Organic Bio Link)
    {
      id: 'EVT-401',
      sessionId: 'USR-8418',
      timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/',
      pageTitle: 'Ken Merrell · Author & Novelist',
      details: 'Landed on Homepage from Instagram Profile Bio link (Free organic)',
    },
    {
      id: 'EVT-402',
      sessionId: 'USR-8418',
      timestamp: new Date(Date.now() - 93 * 60 * 1000).toISOString(),
      eventType: 'pageview',
      pagePath: '/advance-readers',
      pageTitle: 'Become an Advance Reader',
      details: 'Clicked "Advance Readers" in header',
    },
    {
      id: 'EVT-403',
      sessionId: 'USR-8418',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      eventType: 'arc_signup',
      pagePath: '/advance-readers',
      pageTitle: 'Become an Advance Reader',
      details: '*** JOINED ADVANCE READER TEAM *** [Reader: Sarah Jenkins | Format: Ebook]',
    },
  ];

  return { sessions, events };
}

// 30 Days of aggregate traffic trend points for the interactive graph
export interface DailyTrafficPoint {
  date: string; // "May 01"
  isoDate: string; // "2026-05-01"
  visitors: number;
  amazonClicks: number;
  arcSignups: number;
  paidVisitors: number;
  organicVisitors: number;
  adNote?: string;
}

export function generateDailyTrafficHistory(): DailyTrafficPoint[] {
  const points: DailyTrafficPoint[] = [];
  const now = new Date();

  // 30 days history leading up to today
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isoDate = d.toISOString().slice(0, 10);

    let visitors = 35 + Math.floor(Math.sin(i * 0.4) * 15) + (i % 7 === 0 || i % 7 === 1 ? 18 : 0);
    let paid = Math.floor(visitors * 0.55);
    let organic = visitors - paid;
    let amazon = Math.max(2, Math.floor(visitors * 0.18));
    let arc = Math.max(1, Math.floor(visitors * 0.08));
    let note: string | undefined = undefined;

    // Special promo spikes
    if (i === 18) {
      visitors = 195;
      paid = 160;
      organic = 35;
      amazon = 58;
      arc = 14;
      note = 'Instagram Story Ad launch';
    } else if (i === 11) {
      visitors = 280;
      paid = 230;
      organic = 50;
      amazon = 88;
      arc = 22;
      note = 'BookBub Featured Deal launch';
    } else if (i === 4) {
      visitors = 165;
      paid = 120;
      organic = 45;
      amazon = 42;
      arc = 19;
      note = 'Author Newsletter Blast';
    } else if (i === 0) {
      // Today
      visitors = 142;
      paid = 92;
      organic = 50;
      amazon = 82;
      arc = 16;
      note = "Today's Active Campaign";
    }

    points.push({
      date: dayStr,
      isoDate,
      visitors,
      amazonClicks: amazon,
      arcSignups: arc,
      paidVisitors: paid,
      organicVisitors: organic,
      adNote: note,
    });
  }

  return points;
}
