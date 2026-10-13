import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsEvent, AnalyticsKPIs, AnalyticsSession, CampaignSummary } from './types';
import { generateSeedAnalytics, type DailyTrafficPoint } from './seedAnalytics';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'analytics_sessions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'analytics_events.json');
const AD_CLICK_SOURCES = new Set(['Meta', 'TikTok', 'Google', 'Microsoft Ads', 'LinkedIn', 'Pinterest', 'X', 'Reddit']);
const PAID_MEDIA = new Set(['paid', 'paid_ad', 'paid_social', 'paid_search', 'cpc', 'ppc', 'display', 'sponsored']);

let supabaseClient: SupabaseClient | null = null;
function database(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production analytics requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    return null;
  }
  if (!supabaseClient) supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  return supabaseClient;
}

function referralAttribution(referrer?: string): { source: string; medium: string; campaign: string } | null {
  if (!referrer) return null;
  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; }
  const platforms: Array<{ domains: string[]; source: string; medium: string; campaign: string }> = [
    { domains: ['instagram.com', 'instagr.am'], source: 'Instagram', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['facebook.com', 'fb.com', 'fb.watch'], source: 'Facebook', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['tiktok.com'], source: 'TikTok', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['youtube.com', 'youtu.be'], source: 'YouTube', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['pinterest.com', 'pin.it'], source: 'Pinterest', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['linkedin.com', 'lnkd.in'], source: 'LinkedIn', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['x.com', 'twitter.com', 't.co'], source: 'X', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['threads.net'], source: 'Threads', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['reddit.com', 'redd.it'], source: 'Reddit', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['snapchat.com'], source: 'Snapchat', medium: 'organic_social', campaign: 'social_referral' },
    { domains: ['bookbub.com'], source: 'BookBub', medium: 'referral', campaign: 'author_profile' },
    { domains: ['google.com', 'google.co.uk', 'google.ca'], source: 'Google', medium: 'search', campaign: '(organic)' },
  ];
  const match = platforms.find(({ domains }) => domains.some((domain) => host === domain || host.endsWith(`.${domain}`)));
  return match ? { source: match.source, medium: match.medium, campaign: match.campaign } : { source: host, medium: 'referral', campaign: 'referral' };
}

type AnalyticsSnapshot = { sessions: AnalyticsSession[]; events: AnalyticsEvent[] };
async function localSnapshot(): Promise<AnalyticsSnapshot> {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => undefined);
  const seed = generateSeedAnalytics();
  const read = async <T,>(file: string, fallback: T): Promise<T> => {
    try { return JSON.parse(await fs.readFile(file, 'utf8')) as T; }
    catch {
      try { await fs.writeFile(file, JSON.stringify(fallback, null, 2)); } catch { /* local preview can be read-only */ }
      return fallback;
    }
  };
  const [sessions, events] = await Promise.all([
    read(SESSIONS_FILE, seed.sessions),
    read(EVENTS_FILE, seed.events),
  ]);
  return { sessions, events };
}

async function readRows<T>(db: SupabaseClient, table: 'analytics_sessions' | 'analytics_events', since: string): Promise<T[]> {
  const rows: T[] = [];
  const batchSize = 1000;
  for (let from = 0; ; from += batchSize) {
    const timestampColumn = table === 'analytics_sessions' ? 'created_at' : 'occurred_at';
    const { data, error } = await db.from(table).select('data').gte(timestampColumn, since).order(timestampColumn, { ascending: false }).range(from, from + batchSize - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    const batch = data ?? [];
    rows.push(...batch.map((row) => row.data as T));
    if (batch.length < batchSize) break;
  }
  return rows;
}

async function snapshot(): Promise<AnalyticsSnapshot> {
  const db = database();
  if (!db) return localSnapshot();
  const sinceDate = new Date();
  sinceDate.setUTCHours(0, 0, 0, 0);
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 119);
  const since = sinceDate.toISOString();
  const [sessions, events] = await Promise.all([
    readRows<AnalyticsSession>(db, 'analytics_sessions', since),
    readRows<AnalyticsEvent>(db, 'analytics_events', since),
  ]);
  return { sessions, events };
}

function isPaid(session: AnalyticsSession) {
  const medium = session.medium.toLowerCase().replace(/[\s-]+/g, '_');
  return PAID_MEDIA.has(medium) || medium.startsWith('paid_') || medium.endsWith('_paid');
}

function buildDailyTraffic(sessions: AnalyticsSession[], events: AnalyticsEvent[], days = 120): DailyTrafficPoint[] {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const map = new Map<string, DailyTrafficPoint>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const isoDate = date.toISOString().slice(0, 10);
    map.set(isoDate, {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      isoDate, visitors: 0, amazonClicks: 0, arcSignups: 0, paidVisitors: 0, organicVisitors: 0,
    });
  }
  for (const session of sessions) {
    const point = map.get(session.createdAt.slice(0, 10));
    if (!point) continue;
    point.visitors += 1;
    if (isPaid(session)) point.paidVisitors += 1;
    else point.organicVisitors += 1;
  }
  for (const event of events) {
    const point = map.get(event.timestamp.slice(0, 10));
    if (!point) continue;
    if (event.eventType === 'amazon_click') point.amazonClicks += 1;
    if (event.eventType === 'arc_signup') point.arcSignups += 1;
  }
  return [...map.values()];
}

function buildKpis(sessions: AnalyticsSession[], events: AnalyticsEvent[], daily: DailyTrafficPoint[]): AnalyticsKPIs {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const todayPoint = daily.find((point) => point.isoDate === today);
  const yesterdayPoint = daily.find((point) => point.isoDate === yesterday);
  const todayVisitors = todayPoint?.visitors ?? 0;
  const yesterdayVisitors = yesterdayPoint?.visitors ?? 0;
  const totalToday = todayPoint?.visitors ?? 0;
  const paidVisitors = todayPoint?.paidVisitors ?? 0;
  const organicVisitors = todayPoint?.organicVisitors ?? 0;
  const last7 = daily.slice(-7).reduce((sum, point) => sum + point.visitors, 0);
  const todayEvents = events.filter((event) => event.timestamp.slice(0, 10) === today);
  const amazonClicks = todayEvents.filter((event) => event.eventType === 'amazon_click').length;
  const arcSignups = todayEvents.filter((event) => event.eventType === 'arc_signup').length;
  const pageEvents = events.filter((event) => event.eventType === 'pageview').length;
  return {
    todayVisitors, yesterdayVisitors,
    visitorsDeltaPct: yesterdayVisitors ? Math.round(((todayVisitors - yesterdayVisitors) / yesterdayVisitors) * 100) : 0,
    thisWeekVisitors: last7,
    totalViews: pageEvents,
    amazonClicks,
    amazonIntentRate: totalToday ? Number(((amazonClicks / totalToday) * 100).toFixed(1)) : 0,
    arcSignups,
    paidVisitors,
    paidPercentage: totalToday ? Math.round((paidVisitors / totalToday) * 100) : 0,
    organicVisitors,
    organicPercentage: totalToday ? Math.round((organicVisitors / totalToday) * 100) : 0,
  };
}

function buildCampaigns(sessions: AnalyticsSession[], events: AnalyticsEvent[]): CampaignSummary[] {
  const groups = new Map<string, { session: AnalyticsSession; visitorIds: Set<string>; amazonClicks: number; arcSignups: number; videoPlays: number }>();
  const sessionGroups = new Map<string, string>();
  for (const session of sessions) {
    const key = [session.source, session.medium, session.campaign].join('\u0000');
    const group = groups.get(key) ?? { session, visitorIds: new Set<string>(), amazonClicks: 0, arcSignups: 0, videoPlays: 0 };
    group.visitorIds.add(session.id);
    groups.set(key, group);
    sessionGroups.set(session.id, key);
  }
  for (const event of events) {
    const key = sessionGroups.get(event.sessionId);
    const group = key ? groups.get(key) : undefined;
    if (!group) continue;
    if (event.eventType === 'amazon_click') group.amazonClicks += 1;
    if (event.eventType === 'arc_signup') group.arcSignups += 1;
    if (event.eventType === 'video_play') group.videoPlays += 1;
  }
  return [...groups.values()].map(({ session, visitorIds, amazonClicks, arcSignups, videoPlays }) => {
    const visitors = visitorIds.size;
    return {
      campaign: session.campaign || '(not set)', source: session.source || '(not set)', medium: session.medium || '(not set)',
      isPaid: isPaid(session), visitors, amazonClicks, arcSignups, videoPlays,
      conversionRate: visitors ? Number((((amazonClicks + arcSignups) / visitors) * 100).toFixed(1)) : 0,
    };
  }).sort((a, b) => b.visitors - a.visitors).slice(0, 50);
}

function buildTopPages(events: AnalyticsEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) if (event.eventType === 'pageview') counts.set(event.pagePath, (counts.get(event.pagePath) ?? 0) + 1);
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()].map(([page, visits]) => ({ page, visits, percentage: total ? Math.round((visits / total) * 100) : 0 }))
    .sort((a, b) => b.visits - a.visits);
}

export async function getAnalyticsDashboardData() {
  const { sessions, events } = await snapshot();
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - 119);
  const start = cutoff.toISOString();
  const recentSessions = sessions.filter((session) => session.createdAt >= start);
  const recentEvents = events.filter((event) => event.timestamp >= start);
  const dailyTraffic = buildDailyTraffic(sessions, events, 120);
  return {
    kpis: buildKpis(sessions, events, dailyTraffic), dailyTraffic,
    campaigns: buildCampaigns(recentSessions, recentEvents), topPages: buildTopPages(recentEvents),
    sessions: [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    events: [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  };
}

export async function getDailyTrafficSeries() {
  const { sessions, events } = await snapshot();
  return buildDailyTraffic(sessions, events, 120);
}

// Kept as small wrappers for any existing internal callers.
export async function getAllSessions() { return (await snapshot()).sessions; }
export async function getAllEvents() { return (await snapshot()).events; }
export async function getAnalyticsKPIs() { return (await getAnalyticsDashboardData()).kpis; }
export async function getDailyTraffic() { return (await getAnalyticsDashboardData()).dailyTraffic; }
export async function getCampaignLeaderboard() { return (await getAnalyticsDashboardData()).campaigns; }
export async function getTopPages() { return (await getAnalyticsDashboardData()).topPages; }

export async function getVisitorSessionsList(filter?: { action?: 'all' | 'amazon' | 'arc' | 'paid' | 'organic'; search?: string; limit?: number }): Promise<AnalyticsSession[]> {
  let list = [...(await snapshot()).sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.action === 'amazon') list = list.filter((s) => s.exitOutcome === 'amazon_click');
  else if (filter?.action === 'arc') list = list.filter((s) => s.exitOutcome === 'arc_signup');
  else if (filter?.action === 'paid') list = list.filter(isPaid);
  else if (filter?.action === 'organic') list = list.filter((s) => !isPaid(s));
  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter((s) => [s.id, s.campaign, s.source, s.location.city, s.location.country, s.device, s.readerName, s.adClickId]
      .some((value) => value?.toLowerCase().includes(q)));
  }
  if (filter?.limit && filter.limit > 0) list = list.slice(0, filter.limit);
  return list;
}

export async function getSessionDetail(sessionId: string): Promise<{ session: AnalyticsSession | null; events: AnalyticsEvent[] }> {
  const { sessions, events } = await snapshot();
  return {
    session: sessions.find((session) => session.id === sessionId) ?? null,
    events: events.filter((event) => event.sessionId === sessionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  };
}

type IncomingEvent = {
  sessionId?: string; eventType: AnalyticsEvent['eventType']; pagePath: string; pageTitle?: string; bookTitle?: string;
  targetUrl?: string; details?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string;
  adClickId?: string; adClickSource?: string; referrer?: string; device?: string; browser?: string; city?: string; region?: string; country?: string;
};

export async function recordIncomingEvent(payload: IncomingEvent): Promise<{ sessionId: string; eventId: string }> {
  const db = database();
  const local = db ? null : await localSnapshot();
  const sessionId = payload.sessionId || `USR-${randomUUID()}`;
  const adClickId = typeof payload.adClickId === 'string' ? payload.adClickId.trim().slice(0, 300) : '';
  const adClickSource = payload.adClickSource && AD_CLICK_SOURCES.has(payload.adClickSource) ? payload.adClickSource : undefined;
  const now = new Date().toISOString();
  let session = db
    ? await (async () => {
      const { data, error } = await db.from('analytics_sessions').select('data').eq('id', sessionId).maybeSingle();
      if (error) throw new Error(`Could not read analytics session: ${error.message}`);
      return data?.data as AnalyticsSession | undefined;
    })()
    : local!.sessions.find((row) => row.id === sessionId);
  if (!session) {
    const referral = referralAttribution(payload.referrer);
    session = {
      id: sessionId, createdAt: now, updatedAt: now, durationSeconds: 1,
      source: payload.utmSource || (adClickId ? adClickSource : undefined) || referral?.source || 'Direct',
      medium: payload.utmMedium || (adClickId ? (adClickSource === 'Google' || adClickSource === 'Microsoft Ads' ? 'paid_search' : 'paid_social') : referral?.medium) || 'direct',
      campaign: payload.utmCampaign || referral?.campaign || '(direct)', content: payload.utmContent,
      adClickId: adClickId || undefined, adClickSource: adClickId ? adClickSource : undefined,
      location: { city: payload.city || 'Unknown', region: payload.region || 'Unknown', country: payload.country || 'Unknown' },
      device: payload.device || 'Unknown', browser: payload.browser || 'Unknown', landingPage: payload.pagePath,
      referrer: payload.referrer, exitOutcome: 'browse', pageCount: 1,
    };
  } else {
    session.updatedAt = now;
    if (adClickId) { session.adClickId = adClickId; session.adClickSource = adClickSource; }
    session.durationSeconds = Math.max(1, Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000));
    if (payload.eventType === 'pageview') session.pageCount = (session.pageCount || 1) + 1;
  }
  if (payload.eventType === 'amazon_click') { session.exitOutcome = 'amazon_click'; session.outcomeDetail = payload.bookTitle || 'Amazon Storefront'; }
  else if (payload.eventType === 'arc_signup') { session.exitOutcome = 'arc_signup'; session.outcomeDetail = payload.details || 'Advance Reader Signup'; }
  else if (payload.eventType === 'video_play' && session.exitOutcome === 'browse') { session.exitOutcome = 'video_play'; session.outcomeDetail = payload.details || 'Watched Trailer'; }
  const eventId = `EVT-${randomUUID()}`;
  const event: AnalyticsEvent = {
    id: eventId, sessionId, timestamp: now, eventType: payload.eventType, pagePath: payload.pagePath,
    pageTitle: payload.pageTitle, bookTitle: payload.bookTitle, details: payload.details, targetUrl: payload.targetUrl,
  };
  if (db) {
    const [sessionWrite, eventWrite] = await Promise.all([
      db.from('analytics_sessions').upsert({ id: session.id, data: session, created_at: session.createdAt, updated_at: now }),
      db.from('analytics_events').insert({ id: event.id, session_id: sessionId, occurred_at: now, data: event }),
    ]);
    if (sessionWrite.error) throw new Error(`Could not save analytics session: ${sessionWrite.error.message}`);
    if (eventWrite.error) throw new Error(`Could not save analytics event: ${eventWrite.error.message}`);
  } else {
    const sessions = local!.sessions.filter((row) => row.id !== sessionId);
    sessions.unshift(session);
    local!.events.push(event);
    try {
      await Promise.all([
        fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions.slice(0, 500), null, 2)),
        fs.writeFile(EVENTS_FILE, JSON.stringify(local!.events.slice(-1000), null, 2)),
      ]);
    } catch { /* local preview may use read-only storage */ }
  }
  return { sessionId, eventId };
}

export async function bridgeReaderIdentity(sessionId: string, reader: { name: string; email: string; format?: string; bookTitle?: string }) {
  const db = database();
  const local = db ? null : await localSnapshot();
  const session = db
    ? await (async () => {
      const { data, error } = await db.from('analytics_sessions').select('data').eq('id', sessionId).maybeSingle();
      if (error) throw new Error(`Could not read analytics session: ${error.message}`);
      return data?.data as AnalyticsSession | undefined;
    })()
    : local!.sessions.find((row) => row.id === sessionId);
  if (!session) return;
  const now = new Date().toISOString();
  session.readerName = reader.name;
  session.readerEmail = reader.email;
  session.exitOutcome = 'arc_signup';
  session.outcomeDetail = `${reader.name} (${reader.format || 'ARC'})`;
  session.updatedAt = now;
  const event: AnalyticsEvent = {
    id: `EVT-${randomUUID()}`, sessionId, timestamp: now, eventType: 'arc_signup',
    pagePath: '/advance-readers', pageTitle: 'Become an Advance Reader', bookTitle: reader.bookTitle,
    details: `Reader application submitted (${reader.format || 'ARC'})`,
  };
  if (db) {
    const [sessionWrite, eventWrite] = await Promise.all([
      db.from('analytics_sessions').upsert({ id: session.id, data: session, created_at: session.createdAt, updated_at: now }),
      db.from('analytics_events').insert({ id: event.id, session_id: sessionId, occurred_at: now, data: event }),
    ]);
    if (sessionWrite.error) throw new Error(`Could not save reader attribution: ${sessionWrite.error.message}`);
    if (eventWrite.error) throw new Error(`Could not save reader conversion event: ${eventWrite.error.message}`);
  } else {
    local!.events.push(event);
    await Promise.all([
      fs.writeFile(SESSIONS_FILE, JSON.stringify(local!.sessions, null, 2)).catch(() => undefined),
      fs.writeFile(EVENTS_FILE, JSON.stringify(local!.events, null, 2)).catch(() => undefined),
    ]);
  }
}
