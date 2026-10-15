'use client';
import { useMemo, useState } from 'react';
import type { AnalyticsEvent, AnalyticsKPIs, AnalyticsSession } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';
import { Ic } from '../AdIcons';
import {
  RangeTabs, eventsInWindow, isPaidMedium, rangeDaysOf, rangeLabelOf, sessionsInWindow, windowStartOf, type TimeRange,
} from './shared';
import { Donut, Funnel, HBarList, Heatmap, StackedBars, TrendChart, type DonutSegment } from './charts';

interface AnalyticsDashboardProps {
  initialKpis: AnalyticsKPIs;
  dailyTraffic: DailyTrafficPoint[];
  sessions: AnalyticsSession[];
  events: AnalyticsEvent[];
}

const SOURCE_COLORS = ['#c9a860', '#5b9cf6', '#79c9a2', '#e0a46b', '#a78bfa', '#f472b6', '#6b6257'];
const DEVICE_COLORS: Record<string, string> = { Mobile: '#c9a860', Desktop: '#5b9cf6', Tablet: '#79c9a2', Other: '#6b6257' };

function deviceGroup(device: string) {
  const d = device.toLowerCase();
  if (/iphone|android|mobile|phone/.test(d)) return 'Mobile';
  if (/ipad|tablet/.test(d)) return 'Tablet';
  if (/mac|windows|desktop|linux|chrome ?os/.test(d)) return 'Desktop';
  return 'Other';
}

function countBy<T>(items: T[], keyOf: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default function AnalyticsDashboard({ initialKpis, dailyTraffic, sessions, events }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [geoMode, setGeoMode] = useState<'country' | 'city'>('country');

  const rangeDays = rangeDaysOf(timeRange, customStart, customEnd);
  const rangeLabel = rangeLabelOf(timeRange, customStart, customEnd);

  const visibleTraffic = useMemo(() => {
    if (timeRange === 'custom' && customStart && customEnd) {
      return dailyTraffic.filter((p) => p.isoDate >= customStart && p.isoDate <= customEnd);
    }
    return dailyTraffic.slice(-rangeDays);
  }, [dailyTraffic, timeRange, rangeDays, customStart, customEnd]);

  const windowStart = useMemo(() => {
    if (timeRange === 'custom' && customStart) {
      return new Date(`${customStart}T00:00:00.000Z`).getTime();
    }
    return windowStartOf(visibleTraffic);
  }, [timeRange, customStart, visibleTraffic]);

  const windowEnd = useMemo(() => {
    if (timeRange === 'custom' && customEnd) {
      return new Date(`${customEnd}T23:59:59.999Z`).getTime();
    }
    return Date.now();
  }, [timeRange, customEnd]);

  const rangeSessions = useMemo(() => sessionsInWindow(sessions, windowStart, windowEnd), [sessions, windowStart, windowEnd]);
  const rangeEvents = useMemo(() => eventsInWindow(events, windowStart, windowEnd), [events, windowStart, windowEnd]);

  const handleRangeChange = (range: TimeRange, start?: string, end?: string) => {
    setTimeRange(range);
    if (start && end) {
      setCustomStart(start);
      setCustomEnd(end);
    }
  };

  /* ── Totals for KPI cards ── */
  const totals = useMemo(() => visibleTraffic.reduce((t, p) => ({
    visitors: t.visitors + p.visitors,
    paidVisitors: t.paidVisitors + p.paidVisitors,
    organicVisitors: t.organicVisitors + p.organicVisitors,
    amazonClicks: t.amazonClicks + p.amazonClicks,
    arcSignups: t.arcSignups + p.arcSignups,
  }), { visitors: 0, paidVisitors: 0, organicVisitors: 0, amazonClicks: 0, arcSignups: 0 }), [visibleTraffic]);

  /* Previous period of the same length, for trend deltas. */
  const previousTotals = useMemo(() => {
    const prev = dailyTraffic.slice(-rangeDays * 2, -rangeDays);
    if (prev.length < rangeDays) return null;
    return prev.reduce((t, p) => ({
      visitors: t.visitors + p.visitors,
      amazonClicks: t.amazonClicks + p.amazonClicks,
      arcSignups: t.arcSignups + p.arcSignups,
      paidVisitors: t.paidVisitors + p.paidVisitors,
    }), { visitors: 0, amazonClicks: 0, arcSignups: 0, paidVisitors: 0 });
  }, [dailyTraffic, rangeDays]);

  const delta = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    if (!previous) return current ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const paidPct = totals.visitors ? Math.round((totals.paidVisitors / totals.visitors) * 100) : 0;
  const organicPct = totals.visitors ? 100 - paidPct : 0;
  const amazonRate = totals.visitors ? Math.round((totals.amazonClicks / totals.visitors) * 1000) / 10 : 0;
  const arcRate = totals.visitors ? Math.round((totals.arcSignups / totals.visitors) * 1000) / 10 : 0;

  /* ── Engagement stats ── */
  const engagement = useMemo(() => {
    const n = rangeSessions.length;
    if (!n) return { avgDuration: 0, avgPages: 0, bounceRate: 0 };
    const duration = rangeSessions.reduce((s, x) => s + (x.durationSeconds || 0), 0);
    const pages = rangeSessions.reduce((s, x) => s + (x.pageCount || 1), 0);
    const bounces = rangeSessions.filter((x) => (x.pageCount || 1) <= 1 && (x.exitOutcome === 'browse' || x.exitOutcome === 'exit')).length;
    return { avgDuration: Math.round(duration / n), avgPages: Math.round((pages / n) * 10) / 10, bounceRate: Math.round((bounces / n) * 100) };
  }, [rangeSessions]);

  /* ── Funnel ── */
  const funnelSteps = useMemo(() => {
    const reached = (type: AnalyticsEvent['eventType']) => new Set(rangeEvents.filter((e) => e.eventType === type).map((e) => e.sessionId));
    const video = reached('video_play');
    const amazon = reached('amazon_click');
    const arc = reached('arc_signup');
    const engaged = rangeSessions.filter((s) => (s.pageCount || 1) > 1 || video.has(s.id) || amazon.has(s.id) || arc.has(s.id)).length;
    return [
      { label: 'Visited the site', value: rangeSessions.length, color: '#c9a860', hint: 'Every tracked session' },
      { label: 'Engaged', value: engaged, color: '#e0a46b', hint: 'Viewed 2+ pages or took an action' },
      { label: 'Watched a trailer', value: rangeSessions.filter((s) => video.has(s.id)).length, color: '#5b9cf6', hint: 'Played a book video' },
      { label: 'Clicked to Amazon', value: rangeSessions.filter((s) => amazon.has(s.id)).length, color: '#79c9a2', hint: 'Left to buy on Amazon' },
      { label: 'Joined ARC team', value: rangeSessions.filter((s) => arc.has(s.id)).length, color: '#a78bfa', hint: 'Submitted the reader form' },
    ];
  }, [rangeSessions, rangeEvents]);

  /* ── Sources donut ── */
  const sourceSegments = useMemo<DonutSegment[]>(() => {
    const entries = countBy(rangeSessions, (s) => s.source || 'Direct');
    const top = entries.slice(0, 6);
    const rest = entries.slice(6).reduce((sum, [, v]) => sum + v, 0);
    const segments = top.map(([label, value], i) => ({ label, value, color: SOURCE_COLORS[i] }));
    if (rest) segments.push({ label: 'Other', value: rest, color: SOURCE_COLORS[6] });
    return segments;
  }, [rangeSessions]);

  /* ── Device donut ── */
  const deviceSegments = useMemo<DonutSegment[]>(() => countBy(rangeSessions, (s) => deviceGroup(s.device))
    .map(([label, value]) => ({ label, value, color: DEVICE_COLORS[label] })), [rangeSessions]);

  const browserRows = useMemo(() => countBy(rangeSessions, (s) => s.browser || 'Unknown')
    .slice(0, 5).map(([label, value]) => ({ label, value })), [rangeSessions]);

  /* ── Geography ── */
  const geoRows = useMemo(() => countBy(
    rangeSessions.filter((s) => (geoMode === 'country' ? s.location.country : s.location.city) !== 'Unknown'),
    (s) => (geoMode === 'country' ? s.location.country : `${s.location.city}, ${s.location.country}`),
  ).slice(0, 8).map(([label, value]) => ({ label, value })), [rangeSessions, geoMode]);

  /* ── Campaign performance ── */
  const campaignRows = useMemo(() => {
    const bySession = new Map<string, { amazon: number; arc: number }>();
    for (const e of rangeEvents) {
      if (e.eventType !== 'amazon_click' && e.eventType !== 'arc_signup') continue;
      const row = bySession.get(e.sessionId) ?? { amazon: 0, arc: 0 };
      if (e.eventType === 'amazon_click') row.amazon += 1; else row.arc += 1;
      bySession.set(e.sessionId, row);
    }
    const groups = new Map<string, { campaign: string; source: string; paid: boolean; visitors: number; amazon: number; arc: number }>();
    for (const s of rangeSessions) {
      const key = `${s.campaign}\u0000${s.source}`;
      const g = groups.get(key) ?? { campaign: s.campaign || '(not set)', source: s.source, paid: isPaidMedium(s.medium), visitors: 0, amazon: 0, arc: 0 };
      g.visitors += 1;
      const conv = bySession.get(s.id);
      if (conv) { g.amazon += conv.amazon; g.arc += conv.arc; }
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => b.visitors - a.visitors).slice(0, 8);
  }, [rangeSessions, rangeEvents]);
  const campaignMax = Math.max(1, ...campaignRows.map((c) => c.visitors));

  /* ── Top pages ── */
  const pageRows = useMemo(() => countBy(rangeEvents.filter((e) => e.eventType === 'pageview'), (e) => e.pagePath)
    .slice(0, 8).map(([label, value]) => ({ label, value })), [rangeEvents]);

  /* ── Heatmap (local time, Monday first) ── */
  const heatGrid = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const s of rangeSessions) {
      const d = new Date(s.createdAt);
      grid[(d.getDay() + 6) % 7][d.getHours()] += 1;
    }
    return grid;
  }, [rangeSessions]);

  const kpis = [
    { label: timeRange === 'today' ? 'Today’s visitors' : `${rangeDays}-day visitors`, value: totals.visitors, icon: 'user', accent: '#c9a860', d: delta(totals.visitors, previousTotals?.visitors), foot: timeRange === 'today' ? `Yesterday: ${initialKpis.yesterdayVisitors}` : rangeLabel },
    { label: 'Paid ad visitors', value: totals.paidVisitors, icon: 'target', accent: '#3b82f6', d: delta(totals.paidVisitors, previousTotals?.paidVisitors), foot: `${paidPct}% of traffic` },
    { label: 'Amazon clicks', value: totals.amazonClicks, icon: 'ext', accent: '#22c55e', d: delta(totals.amazonClicks, previousTotals?.amazonClicks), foot: `${amazonRate}% intent rate` },
    { label: 'New ARC signups', value: totals.arcSignups, icon: 'readers', accent: '#a78bfa', d: delta(totals.arcSignups, previousTotals?.arcSignups), foot: `${arcRate}% sign-up rate` },
  ];

  return (
    <div className="an-container">
      <div className="crm-top">
        <div>
          <div className="crumb"><span>Ken Merrell Platform</span><span>/</span><span>Performance</span></div>
          <h1>Analytics</h1>
          <p>Charts and trends showing how readers find your books, what they do, and when they visit.</p>
        </div>
        <div className="crm-actions">
          <RangeTabs
            value={timeRange}
            onChange={handleRangeChange}
            customStart={customStart}
            customEnd={customEnd}
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="an-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="an-kpi-card" style={{ '--card-accent': k.accent } as React.CSSProperties}>
            <div className="an-kpi-head">
              <span className="an-kpi-lbl">{k.label}</span>
              <span className="an-kpi-icon"><Ic k={k.icon} s={20} /></span>
            </div>
            <div className="an-kpi-val">{k.value.toLocaleString()}</div>
            <div className="an-kpi-foot">
              {k.d !== null && (
                <span className={`an-badge-delta ${k.d > 0 ? 'pos' : k.d < 0 ? 'neg' : 'neutral'}`} title="Compared with the previous period">
                  {k.d > 0 ? '▲' : k.d < 0 ? '▼' : '•'} {Math.abs(k.d)}%
                </span>
              )}
              <span>{k.foot}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement strip + split */}
      <div className="an-stat-strip">
        <div className="an-stat"><span>Avg. time on site</span><strong>{Math.floor(engagement.avgDuration / 60)}m {engagement.avgDuration % 60}s</strong></div>
        <div className="an-stat"><span>Pages per visit</span><strong>{engagement.avgPages}</strong></div>
        <div className="an-stat"><span>Bounce rate</span><strong>{engagement.bounceRate}%</strong></div>
        <div className="an-stat an-stat-split">
          <span>Paid {paidPct}% · Organic {organicPct}%</span>
          <div className="an-progress-bar" title={`Paid: ${paidPct}% | Organic: ${organicPct}%`}>
            <div className="an-progress-paid" style={{ width: `${paidPct}%` }} />
            <div className="an-progress-org" style={{ width: `${organicPct}%` }} />
          </div>
        </div>
      </div>

      {/* Trend */}
      <section className="an-card" aria-labelledby="trend-title">
        <div className="an-card-head">
          <div>
            <h2 id="trend-title" className="an-card-title"><Ic k="chart" s={22} /> Traffic &amp; conversion trend</h2>
            <p className="an-card-sub">Daily totals for {rangeLabel.toLowerCase()}. Turn series on or off to compare them.</p>
          </div>
        </div>
        <TrendChart data={visibleTraffic} />
      </section>

      {/* Stacked bars + Funnel */}
      <div className="an-grid-even">
        <section className="an-card" aria-labelledby="split-title">
          <div>
            <h2 id="split-title" className="an-card-title"><Ic k="target" s={20} /> Paid vs organic per day</h2>
            <p className="an-card-sub">
              <span className="an-key"><i style={{ background: '#5b9cf6' }} /> Paid {totals.paidVisitors.toLocaleString()}</span>
              <span className="an-key"><i style={{ background: '#c9a860' }} /> Organic {totals.organicVisitors.toLocaleString()}</span>
            </p>
          </div>
          <StackedBars data={visibleTraffic} />
        </section>

        <section className="an-card" aria-labelledby="funnel-title">
          <div>
            <h2 id="funnel-title" className="an-card-title"><Ic k="funnel" s={20} /> Reader conversion funnel</h2>
            <p className="an-card-sub">How many visitors reached each step, {rangeLabel.toLowerCase()}.</p>
          </div>
          <Funnel steps={funnelSteps} />
        </section>
      </div>

      {/* Sources + Devices */}
      <div className="an-grid-even">
        <section className="an-card" aria-labelledby="sources-title">
          <div>
            <h2 id="sources-title" className="an-card-title"><Ic k="globe" s={20} /> Where visitors come from</h2>
            <p className="an-card-sub">Share of sessions by traffic source.</p>
          </div>
          <Donut segments={sourceSegments} centerLabel="visitors" emptyText="No visits in this period yet." />
        </section>

        <section className="an-card" aria-labelledby="devices-title">
          <div>
            <h2 id="devices-title" className="an-card-title"><Ic k="devices" s={20} /> Devices &amp; browsers</h2>
            <p className="an-card-sub">What readers are using to view the site.</p>
          </div>
          <Donut segments={deviceSegments} centerLabel="sessions" emptyText="No device data in this period yet." />
          {browserRows.length > 0 && (
            <div className="an-chip-row" aria-label="Top browsers">
              {browserRows.map((b) => (
                <span key={b.label} className="an-chip">{b.label} <strong>{Math.round((b.value / rangeSessions.length) * 100)}%</strong></span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Campaign performance */}
      <section className="an-card" aria-labelledby="campaign-chart-title">
        <div className="an-card-head">
          <div>
            <h2 id="campaign-chart-title" className="an-card-title"><Ic k="target" s={22} /> Top campaigns</h2>
            <p className="an-card-sub">Visitors brought in by each campaign, with the Amazon clicks and ARC signups they produced.</p>
          </div>
          <div className="an-legend-inline">
            <span className="an-key"><i style={{ background: '#c9a860' }} /> Visitors</span>
            <span className="an-key"><i style={{ background: '#79c9a2' }} /> Amazon</span>
            <span className="an-key"><i style={{ background: '#a78bfa' }} /> ARC</span>
          </div>
        </div>
        {campaignRows.length ? (
          <ul className="an-camp-list">
            {campaignRows.map((c) => {
              const conv = c.visitors ? Math.round(((c.amazon + c.arc) / c.visitors) * 1000) / 10 : 0;
              return (
                <li key={`${c.campaign}-${c.source}`} className="an-camp">
                  <div className="an-camp-head">
                    <strong title={c.campaign}>{c.campaign}</strong>
                    <span className={`an-badge ${c.paid ? 'paid' : 'org'}`}>{c.source} · {c.paid ? 'Paid' : 'Organic'}</span>
                    <span className="an-camp-conv">{conv}% converted</span>
                  </div>
                  <div className="an-camp-bars">
                    <div className="an-camp-bar" style={{ width: `${(c.visitors / campaignMax) * 100}%`, '--fill': '#c9a860' } as React.CSSProperties}><span>{c.visitors}</span></div>
                    <div className="an-camp-sub">
                      <div className="an-camp-bar thin" style={{ width: `${Math.max((c.amazon / campaignMax) * 100, c.amazon ? 1.5 : 0)}%`, '--fill': '#79c9a2' } as React.CSSProperties} />
                      <small>{c.amazon} Amazon</small>
                      <div className="an-camp-bar thin" style={{ width: `${Math.max((c.arc / campaignMax) * 100, c.arc ? 1.5 : 0)}%`, '--fill': '#a78bfa' } as React.CSSProperties} />
                      <small>{c.arc} ARC</small>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="an-empty">No campaign traffic in this period yet.</p>}
      </section>

      {/* Geography + Top pages */}
      <div className="an-grid-even">
        <section className="an-card" aria-labelledby="geo-title">
          <div className="an-card-head">
            <div>
              <h2 id="geo-title" className="an-card-title"><Ic k="globe" s={20} /> Top locations</h2>
              <p className="an-card-sub">Where your readers are visiting from.</p>
            </div>
            <div className="crm-tabs" aria-label="Location grouping">
              <button type="button" id="geo-country" className={geoMode === 'country' ? 'on' : ''} onClick={() => setGeoMode('country')}>Countries</button>
              <button type="button" id="geo-city" className={geoMode === 'city' ? 'on' : ''} onClick={() => setGeoMode('city')}>Cities</button>
            </div>
          </div>
          <HBarList rows={geoRows} color="#5b9cf6" emptyText="No location data in this period yet." />
        </section>

        <section className="an-card" aria-labelledby="pages-title">
          <div>
            <h2 id="pages-title" className="an-card-title"><Ic k="books" s={20} /> Most viewed pages</h2>
            <p className="an-card-sub">Page views across every campaign.</p>
          </div>
          <HBarList rows={pageRows} color="#c9a860" emptyText="No page views in this period yet." />
        </section>
      </div>

      {/* Heatmap */}
      <section className="an-card" aria-labelledby="heat-title">
        <div>
          <h2 id="heat-title" className="an-card-title"><Ic k="clock" s={22} /> Best time to post</h2>
          <p className="an-card-sub">Visits by day of week and hour (your local time). Schedule ads and posts for the darker cells.</p>
        </div>
        <Heatmap grid={heatGrid} />
      </section>
    </div>
  );
}
