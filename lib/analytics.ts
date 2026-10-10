import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  AnalyticsSession,
  AnalyticsEvent,
  AnalyticsKPIs,
  CampaignSummary,
} from './types';
import {
  generateSeedAnalytics,
  generateDailyTrafficHistory,
  type DailyTrafficPoint,
} from './seedAnalytics';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'analytics_sessions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'analytics_events.json');

// Initialize local files if not present
async function ensureDataFiles(): Promise<{ sessions: AnalyticsSession[]; events: AnalyticsEvent[] }> {
  let sessions: AnalyticsSession[] = [];
  let events: AnalyticsEvent[] = [];

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }

  try {
    const rawSessions = await fs.readFile(SESSIONS_FILE, 'utf8');
    sessions = JSON.parse(rawSessions);
  } catch {
    const seed = generateSeedAnalytics();
    sessions = seed.sessions;
    try {
      await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    } catch {
      /* ignore read-only */
    }
  }

  try {
    const rawEvents = await fs.readFile(EVENTS_FILE, 'utf8');
    events = JSON.parse(rawEvents);
  } catch {
    const seed = generateSeedAnalytics();
    events = seed.events;
    try {
      await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
    } catch {
      /* ignore read-only */
    }
  }

  return { sessions, events };
}

export async function getAllSessions(): Promise<AnalyticsSession[]> {
  const { sessions } = await ensureDataFiles();
  return sessions;
}

export async function getAllEvents(): Promise<AnalyticsEvent[]> {
  const { events } = await ensureDataFiles();
  return events;
}

export async function getAnalyticsKPIs(period: string = 'today'): Promise<AnalyticsKPIs> {
  const sessions = await getAllSessions();
  const dailyHistory = generateDailyTrafficHistory();

  const todayPoint = dailyHistory[dailyHistory.length - 1] || {
    visitors: 142,
    amazonClicks: 82,
    arcSignups: 16,
    paidVisitors: 92,
    organicVisitors: 50,
  };
  const yesterdayPoint = dailyHistory[dailyHistory.length - 2] || {
    visitors: 111,
  };

  const delta = Math.round(
    ((todayPoint.visitors - yesterdayPoint.visitors) / Math.max(1, yesterdayPoint.visitors)) * 100
  );

  // Sum last 7 days
  const last7Days = dailyHistory.slice(-7);
  const thisWeekVisitors = last7Days.reduce((acc, d) => acc + d.visitors, 0);
  const totalViews = dailyHistory.reduce((acc, d) => acc + d.visitors, 0) + 1200;

  const paidVisitors = todayPoint.paidVisitors;
  const organicVisitors = todayPoint.organicVisitors;
  const totalToday = Math.max(1, paidVisitors + organicVisitors);
  const paidPct = Math.round((paidVisitors / totalToday) * 100);
  const organicPct = 100 - paidPct;

  const amazonRate = Number(((todayPoint.amazonClicks / totalToday) * 100).toFixed(1));

  return {
    todayVisitors: todayPoint.visitors,
    yesterdayVisitors: yesterdayPoint.visitors,
    visitorsDeltaPct: delta,
    thisWeekVisitors,
    totalViews,
    amazonClicks: todayPoint.amazonClicks,
    amazonIntentRate: amazonRate,
    arcSignups: todayPoint.arcSignups,
    paidVisitors,
    paidPercentage: paidPct,
    organicVisitors,
    organicPercentage: organicPct,
  };
}

export async function getDailyTraffic(): Promise<DailyTrafficPoint[]> {
  return generateDailyTrafficHistory();
}

export async function getCampaignLeaderboard(): Promise<CampaignSummary[]> {
  return [
    {
      campaign: 'Spring Fantasy Launch',
      source: 'Instagram',
      medium: 'paid_ad',
      isPaid: true,
      visitors: 450,
      amazonClicks: 82,
      arcSignups: 16,
      videoPlays: 64,
      conversionRate: 21.7,
      estimatedCost: 40,
      costPerClick: 0.48,
      notes: 'Instagram Story Ad Trail ($0.48/click)',
    },
    {
      campaign: 'BookBub Featured Deal',
      source: 'BookBub',
      medium: 'cpc',
      isPaid: true,
      visitors: 720,
      amazonClicks: 215,
      arcSignups: 28,
      videoPlays: 42,
      conversionRate: 33.7,
      estimatedCost: 85,
      costPerClick: 0.39,
      notes: 'Highest Amazon purchase volume',
    },
    {
      campaign: 'Instagram Profile Bio Link',
      source: 'Instagram',
      medium: 'organic_bio',
      isPaid: false,
      visitors: 140,
      amazonClicks: 45,
      arcSignups: 21,
      videoPlays: 38,
      conversionRate: 47.1,
      estimatedCost: 0,
      costPerClick: 0,
      notes: 'Free organic profile traffic ($0 spend)',
    },
    {
      campaign: 'Author Newsletter May',
      source: 'Email',
      medium: 'newsletter',
      isPaid: false,
      visitors: 130,
      amazonClicks: 35,
      arcSignups: 48,
      videoPlays: 25,
      conversionRate: 63.8,
      estimatedCost: 0,
      costPerClick: 0,
      notes: 'Top ARC team conversion rate (63.8%)',
    },
    {
      campaign: 'Facebook Boosted Post',
      source: 'Facebook',
      medium: 'paid_ad',
      isPaid: true,
      visitors: 210,
      amazonClicks: 38,
      arcSignups: 9,
      videoPlays: 31,
      conversionRate: 22.3,
      estimatedCost: 25,
      costPerClick: 0.65,
      notes: 'Meta Newsfeed Sponsored Post',
    },
    {
      campaign: 'TikTok BookTok Reel',
      source: 'TikTok',
      medium: 'organic_bio',
      isPaid: false,
      visitors: 95,
      amazonClicks: 32,
      arcSignups: 18,
      videoPlays: 55,
      conversionRate: 52.6,
      estimatedCost: 0,
      costPerClick: 0,
      notes: 'Viral character reveal trailer reel',
    },
  ];
}

export async function getTopPages(): Promise<Array<{ page: string; visits: number; percentage: number }>> {
  return [
    { page: 'The Iron Gate (Book Page)', visits: 1450, percentage: 42 },
    { page: 'Homepage & 3D Book Showcase', visits: 1120, percentage: 32 },
    { page: 'Advance Reader Signup Page', visits: 580, percentage: 17 },
    { page: 'About Ken Merrell (Author Bio)', visits: 300, percentage: 9 },
  ];
}

export async function getVisitorSessionsList(filter?: {
  action?: 'all' | 'amazon' | 'arc' | 'paid' | 'organic';
  search?: string;
  limit?: number;
}): Promise<AnalyticsSession[]> {
  const { sessions } = await ensureDataFiles();
  let list = [...sessions];

  if (filter?.action) {
    if (filter.action === 'amazon') {
      list = list.filter((s) => s.exitOutcome === 'amazon_click');
    } else if (filter.action === 'arc') {
      list = list.filter((s) => s.exitOutcome === 'arc_signup');
    } else if (filter.action === 'paid') {
      list = list.filter((s) => s.medium.includes('ad') || s.medium === 'cpc' || s.medium === 'paid_ad');
    } else if (filter.action === 'organic') {
      list = list.filter((s) => !s.medium.includes('ad') && s.medium !== 'cpc');
    }
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.campaign.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q) ||
        s.location.city.toLowerCase().includes(q) ||
        s.location.country.toLowerCase().includes(q) ||
        s.device.toLowerCase().includes(q) ||
        (s.readerName && s.readerName.toLowerCase().includes(q))
    );
  }

  if (filter?.limit && filter.limit > 0) {
    list = list.slice(0, filter.limit);
  }

  return list;
}

export async function getSessionDetail(sessionId: string): Promise<{
  session: AnalyticsSession | null;
  events: AnalyticsEvent[];
}> {
  const { sessions, events } = await ensureDataFiles();
  const session = sessions.find((s) => s.id === sessionId) || null;
  const sessionEvents = events
    .filter((e) => e.sessionId === sessionId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return { session, events: sessionEvents };
}

// Track inbound event / session from client
export async function recordIncomingEvent(payload: {
  sessionId?: string;
  eventType: 'pageview' | 'amazon_click' | 'video_play' | 'arc_signup' | 'scroll_quote';
  pagePath: string;
  pageTitle?: string;
  bookTitle?: string;
  targetUrl?: string;
  details?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  city?: string;
  region?: string;
  country?: string;
}): Promise<{ sessionId: string; eventId: string }> {
  const { sessions, events } = await ensureDataFiles();

  const validSessionId: string =
    payload.sessionId || `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  let session = sessions.find((s) => s.id === validSessionId);

  const nowIso = new Date().toISOString();

  if (!session) {
    const sessionId = validSessionId;

    let source = payload.utmSource || 'Direct';
    let medium = payload.utmMedium || 'direct';
    let campaign = payload.utmCampaign || '(direct)';

    // Automatic Referrer Detection if no UTM was provided
    if (!payload.utmSource && payload.referrer) {
      const ref = payload.referrer.toLowerCase();
      if (ref.includes('instagram.com')) {
        source = 'Instagram';
        medium = 'organic_bio';
        campaign = 'profile_bio';
      } else if (ref.includes('facebook.com') || ref.includes('fb.com')) {
        source = 'Facebook';
        medium = 'referral';
        campaign = 'post_share';
      } else if (ref.includes('google.')) {
        source = 'Google';
        medium = 'search';
        campaign = '(organic)';
      } else if (ref.includes('tiktok.com')) {
        source = 'TikTok';
        medium = 'organic_bio';
        campaign = 'profile_bio';
      } else if (ref.includes('bookbub.com')) {
        source = 'BookBub';
        medium = 'referral';
        campaign = 'author_profile';
      }
    }

    session = {
      id: sessionId,
      createdAt: nowIso,
      updatedAt: nowIso,
      durationSeconds: 1,
      source,
      medium,
      campaign,
      content: payload.utmContent,
      location: {
        city: payload.city || 'Austin',
        region: payload.region || 'Texas',
        country: payload.country || 'United States',
      },
      device: payload.device || 'Mobile',
      browser: payload.browser || 'Safari',
      landingPage: payload.pagePath,
      referrer: payload.referrer,
      exitOutcome: 'browse',
      pageCount: 1,
    };
    sessions.unshift(session);
  } else {
    session.updatedAt = nowIso;
    const dur = Math.max(1, Math.round((new Date(nowIso).getTime() - new Date(session.createdAt).getTime()) / 1000));
    session.durationSeconds = dur;

    if (payload.eventType === 'pageview') {
      session.pageCount = (session.pageCount || 1) + 1;
    }
  }

  // Update session outcome if conversion event
  if (payload.eventType === 'amazon_click') {
    session.exitOutcome = 'amazon_click';
    session.outcomeDetail = payload.bookTitle || 'Amazon Storefront';
  } else if (payload.eventType === 'arc_signup') {
    session.exitOutcome = 'arc_signup';
    session.outcomeDetail = payload.details || 'Advance Reader Signup';
  } else if (payload.eventType === 'video_play' && session.exitOutcome === 'browse') {
    session.exitOutcome = 'video_play';
    session.outcomeDetail = payload.details || 'Watched Trailer';
  }

  const eventId = `EVT-${Math.floor(10000 + Math.random() * 90000)}`;
  const event: AnalyticsEvent = {
    id: eventId,
    sessionId: validSessionId,
    timestamp: nowIso,
    eventType: payload.eventType,
    pagePath: payload.pagePath,
    pageTitle: payload.pageTitle,
    bookTitle: payload.bookTitle,
    details: payload.details,
    targetUrl: payload.targetUrl,
  };
  events.push(event);

  try {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions.slice(0, 500), null, 2));
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events.slice(0, 1000), null, 2));
  } catch {
    /* ignore read-only */
  }

  return { sessionId: validSessionId, eventId };
}

// Identity bridging: Tie anonymous session history to real reader contact
export async function bridgeReaderIdentity(
  sessionId: string,
  reader: { name: string; email: string; format?: string; bookTitle?: string }
) {
  const { sessions, events } = await ensureDataFiles();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  session.readerName = reader.name;
  session.readerEmail = reader.email;
  session.exitOutcome = 'arc_signup';
  session.outcomeDetail = `${reader.name} (${reader.format || 'ARC'})`;
  session.updatedAt = new Date().toISOString();

  // Add ARC signup event
  const eventId = `EVT-${Math.floor(10000 + Math.random() * 90000)}`;
  events.push({
    id: eventId,
    sessionId,
    timestamp: new Date().toISOString(),
    eventType: 'arc_signup',
    pagePath: '/advance-readers',
    pageTitle: 'Become an Advance Reader',
    bookTitle: reader.bookTitle,
    details: `*** SUBMITTED ADVANCE READER APPLICATION *** [Reader: ${reader.name} | Email: ${reader.email} | Format: ${reader.format || 'ARC'}]`,
  });

  try {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
  } catch {
    /* ignore */
  }
}
