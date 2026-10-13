'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Book, AnalyticsKPIs, CampaignSummary, AnalyticsSession, AnalyticsEvent } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';
import { Ic } from './AdIcons';

function isPaidMedium(medium: string) {
  const normalized = medium.toLowerCase().replace(/[\s-]+/g, '_');
  return ['paid', 'cpc', 'ppc', 'display', 'sponsored'].includes(normalized)
    || normalized.startsWith('paid_') || normalized.endsWith('_paid');
}

interface AnalyticsClientProps {
  initialKpis: AnalyticsKPIs;
  dailyTraffic: DailyTrafficPoint[];
  campaigns: CampaignSummary[];
  topPages: Array<{ page: string; visits: number; percentage: number }>;
  initialSessions: AnalyticsSession[];
  initialEvents: AnalyticsEvent[];
  books: Book[];
}

const linkPlacementGuides: Record<string, { title: string; intro: string; steps: Array<{ label: string; detail: string }> }> = {
  instagram_ad: {
    title: 'Instagram Paid Story / Reel Ad',
    intro: 'Use this generated link as the destination for your Instagram ad.',
    steps: [
      { label: 'Open Meta Ads Manager', detail: 'Edit your Facebook or Instagram ad and find the Website URL field in the ad destination settings.' },
      { label: 'Paste the tracking link', detail: 'Paste the complete generated link into Website URL. If you already have a destination URL, put only the query string beginning with ?utm_source= in URL Parameters.' },
      { label: 'Check before publishing', detail: 'Preview the ad and confirm its button opens the selected book or homepage.' },
    ],
  },
  instagram_bio: {
    title: 'Instagram Profile Bio Link (Free)',
    intro: 'Use this link for organic visits from your Instagram profile, not a paid ad.',
    steps: [
      { label: 'Open your Instagram profile', detail: 'Choose Edit Profile, then Links, then Add external link.' },
      { label: 'Add the generated link', detail: 'Paste the complete tracking link, give it a clear title, and save. Keep this link in your profile while you want to measure bio traffic.' },
    ],
  },
  facebook_ad: {
    title: 'Facebook Newsfeed Paid Ad',
    intro: 'Use this generated link as the destination for your Facebook ad.',
    steps: [
      { label: 'Open Meta Ads Manager', detail: 'Edit the Facebook ad and locate the Website URL field under its destination settings.' },
      { label: 'Paste the tracking link', detail: 'Paste the complete generated link into Website URL. If using URL Parameters, paste only the query string beginning with ?utm_source=.' },
      { label: 'Check before publishing', detail: 'Preview the ad and confirm its button opens the selected book or homepage.' },
    ],
  },
  bookbub_deal: {
    title: 'BookBub Featured Deal / Ad',
    intro: 'Use this link as the book destination for the BookBub promotion.',
    steps: [
      { label: 'Edit the promotion destination', detail: 'In the BookBub deal or ad setup, choose the destination URL for your book.' },
      { label: 'Paste and verify', detail: 'Paste the complete generated link, then preview or test it to confirm it opens the selected page on your site.' },
    ],
  },
  newsletter: {
    title: 'Author Email Newsletter',
    intro: 'Use this link on the email button or text link for this campaign.',
    steps: [
      { label: 'Edit your email', detail: 'In your email platform, select the button or text that should send readers to the book.' },
      { label: 'Set the link destination', detail: 'Paste the complete generated link as the button or hyperlink URL, then send yourself a test email and check it.' },
    ],
  },
  tiktok_bio: {
    title: 'TikTok Profile Bio Link',
    intro: 'Use this link for organic visits from your TikTok profile.',
    steps: [
      { label: 'Edit your TikTok profile', detail: 'Open Edit profile and find the website or link field available for your account.' },
      { label: 'Add the generated link', detail: 'Paste the complete tracking link and save. Test the profile link to confirm it opens the selected page.' },
    ],
  },
  youtube: {
    title: 'YouTube Channel / Video',
    intro: 'Choose where viewers should find the tracked link.',
    steps: [
      { label: 'For a video', detail: 'Paste the complete link into the video description near the top, with a short call to action.' },
      { label: 'For your channel', detail: 'Add the complete link to your channel profile links. Test it from the public channel or video page.' },
    ],
  },
  pinterest: {
    title: 'Pinterest Pin',
    intro: 'Attach this link to the Pin that promotes the selected book or page.',
    steps: [
      { label: 'Edit or create a Pin', detail: 'Open the Pin details and find its destination link field.' },
      { label: 'Set the destination', detail: 'Paste the complete generated link, save the Pin, and open it once to verify the destination.' },
    ],
  },
  linkedin: {
    title: 'LinkedIn Post',
    intro: 'Use this link on the LinkedIn post promoting the selected book or page.',
    steps: [
      { label: 'Create or edit the post', detail: 'Paste the complete generated link into the post and add a clear call to action.' },
      { label: 'Check the preview', detail: 'Confirm the link preview and destination are correct before publishing.' },
    ],
  },
  x: {
    title: 'X / Twitter Post',
    intro: 'Use this link in the post promoting the selected book or page.',
    steps: [
      { label: 'Compose the post', detail: 'Paste the complete generated link into your post with a short call to action.' },
      { label: 'Verify the destination', detail: 'Open the link in a preview or test post to confirm it leads to the right page.' },
    ],
  },
  custom: {
    title: 'Custom Marketing Channel',
    intro: 'Place this link wherever you promote the selected book or page.',
    steps: [
      { label: 'Set the destination', detail: 'Paste the complete generated link into the channel’s website, button, or call-to-action URL field.' },
      { label: 'Test the link', detail: 'Open it once before sharing to confirm the page and campaign details are correct.' },
    ],
  },
};

export default function AnalyticsClient({
  initialKpis,
  dailyTraffic,
  campaigns,
  topPages,
  initialSessions,
  initialEvents,
  books,
}: AnalyticsClientProps) {
  // Filters & State
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '120d'>('30d');
  const [trafficPoints, setTrafficPoints] = useState(dailyTraffic);

  const refreshTraffic = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics/traffic', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json() as { dailyTraffic?: DailyTrafficPoint[] };
      if (Array.isArray(data.dailyTraffic)) setTrafficPoints(data.dailyTraffic);
    } catch {
      // Keep the last successful snapshot if the network is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    let busy = false;
    const refreshWhenVisible = async () => {
      if (document.visibilityState !== 'visible' || busy) return;
      busy = true;
      await refreshTraffic();
      busy = false;
    };
    void refreshWhenVisible();
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshTraffic]);
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrafficPoint | null>(null);

  // Link Generator State
  const [selectedBookSlug, setSelectedBookSlug] = useState<string>(books[0]?.slug || 'petticoats-and-ash');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram_ad');
  const [campaignName, setCampaignName] = useState<string>('spring_promo_trail');
  const [adContent, setAdContent] = useState<string>('cinematic_trailer_9x16');
  const [copied, setCopied] = useState(false);
  const [showHowToPaste, setShowHowToPaste] = useState(false);
  const selectedLinkGuide = linkPlacementGuides[selectedPlatform] ?? linkPlacementGuides.custom;

  // Visitor Feed State
  const [visitorFilter, setVisitorFilter] = useState<'all' | 'amazon' | 'arc' | 'paid' | 'organic'>('all');
  const [visitorSearch, setVisitorSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<AnalyticsSession | null>(null);
  const [leadFilter, setLeadFilter] = useState<'all' | 'paid' | 'marketing'>('all');
  const [leadSearch, setLeadSearch] = useState('');

  // Generate dynamic tracking link
  const generatedLink = useMemo(() => {
    let source = 'instagram';
    let medium = 'paid_ad';

    switch (selectedPlatform) {
      case 'instagram_ad':
        source = 'instagram';
        medium = 'paid_ad';
        break;
      case 'instagram_bio':
        source = 'instagram';
        medium = 'organic_bio';
        break;
      case 'facebook_ad':
        source = 'facebook';
        medium = 'paid_ad';
        break;
      case 'bookbub_deal':
        source = 'bookbub';
        medium = 'cpc';
        break;
      case 'newsletter':
        source = 'newsletter';
        medium = 'email';
        break;
      case 'tiktok_bio':
        source = 'tiktok';
        medium = 'organic_bio';
        break;
      case 'youtube':
        source = 'youtube';
        medium = 'organic_social';
        break;
      case 'pinterest':
        source = 'pinterest';
        medium = 'organic_social';
        break;
      case 'linkedin':
        source = 'linkedin';
        medium = 'organic_social';
        break;
      case 'x':
        source = 'x';
        medium = 'organic_social';
        break;
      case 'custom':
        source = 'custom';
        medium = 'promo';
        break;
    }

    const host = typeof window !== 'undefined' ? window.location.origin : 'https://www.kenmerrell.com';
    const basePath = selectedBookSlug === 'home' ? '/' : `/books/${selectedBookSlug}`;
    const params = new URLSearchParams();
    params.set('utm_source', source);
    params.set('utm_medium', medium);
    if (campaignName.trim()) params.set('utm_campaign', campaignName.trim().replace(/\s+/g, '_'));
    if (adContent.trim()) params.set('utm_content', adContent.trim().replace(/\s+/g, '_'));

    return `${host}${basePath}?${params.toString()}`;
  }, [selectedBookSlug, selectedPlatform, campaignName, adContent]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  // Filtered visitor list
  const filteredVisitors = useMemo(() => {
    return initialSessions.filter((s) => {
      if (visitorFilter === 'amazon' && s.exitOutcome !== 'amazon_click') return false;
      if (visitorFilter === 'arc' && s.exitOutcome !== 'arc_signup') return false;
      if (visitorFilter === 'paid' && !isPaidMedium(s.medium)) return false;
      if (visitorFilter === 'organic' && isPaidMedium(s.medium)) return false;

      if (visitorSearch.trim()) {
        const q = visitorSearch.toLowerCase();
        const matches =
          s.id.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          s.campaign.toLowerCase().includes(q) ||
          s.location.city.toLowerCase().includes(q) ||
          s.location.country.toLowerCase().includes(q) ||
          s.device.toLowerCase().includes(q) ||
          (s.adClickId && s.adClickId.toLowerCase().includes(q)) ||
          (s.readerName && s.readerName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [initialSessions, visitorFilter, visitorSearch]);

  // Clickstream events for selected visitor
  const selectedVisitorEvents = useMemo(() => {
    if (!selectedVisitor) return [];
    return initialEvents
      .filter((e) => e.sessionId === selectedVisitor.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedVisitor, initialEvents]);

  // Chart calculations (30 Days)
  const rangeDays = timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 120;
  const visibleTraffic = useMemo(() => trafficPoints.slice(-rangeDays), [trafficPoints, rangeDays]);
  const rangeTotals = useMemo(() => visibleTraffic.reduce((totals, point) => ({
    visitors: totals.visitors + point.visitors,
    paidVisitors: totals.paidVisitors + point.paidVisitors,
    organicVisitors: totals.organicVisitors + point.organicVisitors,
    amazonClicks: totals.amazonClicks + point.amazonClicks,
    arcSignups: totals.arcSignups + point.arcSignups,
  }), { visitors: 0, paidVisitors: 0, organicVisitors: 0, amazonClicks: 0, arcSignups: 0 }), [visibleTraffic]);
  const paidPercentage = rangeTotals.visitors ? Math.round((rangeTotals.paidVisitors / rangeTotals.visitors) * 100) : 0;
  const organicPercentage = rangeTotals.visitors ? 100 - paidPercentage : 0;
  const amazonIntentRate = rangeTotals.visitors
    ? Math.round((rangeTotals.amazonClicks / rangeTotals.visitors) * 1000) / 10
    : 0;
  const rangeLabel = timeRange === 'today' ? 'Today' : `Last ${rangeDays} days`;
  const leadWindowStart = visibleTraffic[0]
    ? new Date(`${visibleTraffic[0].isoDate}T00:00:00.000Z`).getTime()
    : 0;

  const socialPlatformRows = useMemo(() => {
    const platformNames: Record<string, string> = {
      instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube',
      pinterest: 'Pinterest', linkedin: 'LinkedIn', x: 'X', twitter: 'X', threads: 'Threads',
      reddit: 'Reddit', snapchat: 'Snapchat',
    };
    const totals = new Map<string, { name: string; paidVisitors: number; campaigns: Set<string>; amazonClicks: number }>();
    const now = Date.now();

    initialSessions.forEach((session) => {
      const createdAt = new Date(session.createdAt).getTime();
      if (createdAt < leadWindowStart || createdAt > now) return;
      const platform = platformNames[session.source.trim().toLowerCase()];
      if (!platform) return;
      const isPaid = isPaidMedium(session.medium);
      if (!isPaid) return;
      const row = totals.get(platform) || { name: platform, paidVisitors: 0, campaigns: new Set<string>(), amazonClicks: 0 };
      row.paidVisitors += 1;
      if (session.campaign && !['(direct)', 'social_referral'].includes(session.campaign)) row.campaigns.add(session.campaign);
      if (session.exitOutcome === 'amazon_click') row.amazonClicks += 1;
      totals.set(platform, row);
    });

    return [...totals.values()].sort((a, b) => b.paidVisitors - a.paidVisitors);
  }, [initialSessions, leadWindowStart]);

  const campaignLeads = useMemo(() => initialSessions
    .filter((session) => session.exitOutcome === 'arc_signup' && Boolean(session.readerEmail?.trim()))
    .filter((session) => new Date(session.updatedAt || session.createdAt).getTime() >= leadWindowStart)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()),
  [initialSessions, leadWindowStart]);

  const leadCounts = useMemo(() => campaignLeads.reduce((counts, session) => {
    const isPaid = isPaidMedium(session.medium);
    counts[isPaid ? 'paid' : 'marketing'] += 1;
    return counts;
  }, { all: campaignLeads.length, paid: 0, marketing: 0 }), [campaignLeads]);

  const filteredCampaignLeads = useMemo(() => campaignLeads.filter((session) => {
    const isPaid = isPaidMedium(session.medium);
    if (leadFilter === 'paid' && !isPaid) return false;
    if (leadFilter === 'marketing' && isPaid) return false;
    const query = leadSearch.trim().toLowerCase();
    if (!query) return true;
    return [session.readerName, session.readerEmail, session.source, session.campaign]
      .some((value) => value?.toLowerCase().includes(query));
  }), [campaignLeads, leadFilter, leadSearch]);

  const maxMetricVal = useMemo(() => Math.max(
    ...visibleTraffic.flatMap((point) => [point.paidVisitors, point.organicVisitors]),
    10
  ), [visibleTraffic]);

  const chartPoints = useMemo(() => {
    const left = 52;
    const right = 656;
    const top = 24;
    const bottom = 218;
    const denominator = Math.max(visibleTraffic.length - 1, 1);

    return visibleTraffic.map((point, index) => {
      return {
        point,
        x: left + (index / denominator) * (right - left),
        paidY: bottom - (point.paidVisitors / maxMetricVal) * (bottom - top),
        organicY: bottom - (point.organicVisitors / maxMetricVal) * (bottom - top),
      };
    });
  }, [visibleTraffic, maxMetricVal]);

  const paidLinePath = chartPoints.map(({ x, paidY }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${paidY}`).join(' ');
  const organicLinePath = chartPoints.map(({ x, organicY }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${organicY}`).join(' ');

  return (
    <div className="an-container">
      {/* ── Top Header Controls ── */}
      <div className="crm-top">
        <div>
          <div className="crumb">
            <span>Ken Merrell Platform</span>
            <span>/</span>
            <span>Performance</span>
          </div>
          <h1>Ad Tracking & Analytics</h1>
          <p>See which campaigns bring readers to your books and who joins your advance reader team.</p>
        </div>

        <div className="crm-actions">
          <div className="crm-tabs" aria-label="Analytics date range">
            <button
              type="button"
              className={timeRange === 'today' ? 'on' : ''}
              onClick={() => setTimeRange('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={timeRange === '7d' ? 'on' : ''}
              onClick={() => setTimeRange('7d')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={timeRange === '30d' ? 'on' : ''}
              onClick={() => setTimeRange('30d')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              className={timeRange === '120d' ? 'on' : ''}
              onClick={() => setTimeRange('120d')}
            >
              Last 120 Days
            </button>
          </div>

          <button
            type="button"
            className="crm-btn"
            onClick={() => void refreshTraffic()}
            title="Refresh Live Metrics"
          >
            <Ic k="chart" s={16} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* ── Screen Output 1: Executive KPI Cards ── */}
      <div className="an-kpis">
        {/* Card 1: Today's Viewers */}
        <div className="an-kpi-card" style={{ '--card-accent': '#c9a860' } as React.CSSProperties}>
          <div className="an-kpi-head">
            <span className="an-kpi-lbl">{timeRange === 'today' ? 'Today’s Viewers' : `${rangeDays}-Day Visitors`}</span>
            <span className="an-kpi-icon"><Ic k="user" s={20} /></span>
          </div>
          <div className="an-kpi-val">{rangeTotals.visitors.toLocaleString()}</div>
          <div className="an-kpi-foot">
            {timeRange === 'today' ? (
              <>
                <span className="an-badge-delta pos">+{initialKpis.visitorsDeltaPct}%</span>
                <span>vs. yesterday ({initialKpis.yesterdayVisitors})</span>
              </>
            ) : (
              <>
                <span className="an-badge-delta neutral">{rangeLabel}</span>
                <span>total visitors</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Paid visitors in the selected range */}
        <div className="an-kpi-card" style={{ '--card-accent': '#3b82f6' } as React.CSSProperties}>
          <div className="an-kpi-head">
            <span className="an-kpi-lbl">Paid Ad Visitors</span>
            <span className="an-kpi-icon"><Ic k="target" s={20} /></span>
          </div>
          <div className="an-kpi-val">{rangeTotals.paidVisitors.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta info">{paidPercentage}% of traffic</span>
            <span>campaign visitors</span>
          </div>
        </div>

        {/* Card 3: Amazon Outbound Clicks */}
        <div className="an-kpi-card" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="an-kpi-head">
            <span className="an-kpi-lbl">Amazon Clicks</span>
            <span className="an-kpi-icon"><Ic k="ext" s={20} /></span>
          </div>
          <div className="an-kpi-val">{rangeTotals.amazonClicks.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta pos">
              {amazonIntentRate}% Intent Rate
            </span>
            <span>outbound buyers</span>
          </div>
        </div>

        {/* Card 4: New ARC Signups */}
        <div className="an-kpi-card" style={{ '--card-accent': '#f59e0b' } as React.CSSProperties}>
          <div className="an-kpi-head">
            <span className="an-kpi-lbl">New ARC Signups</span>
            <span className="an-kpi-icon"><Ic k="readers" s={20} /></span>
          </div>
          <div className="an-kpi-val">{rangeTotals.arcSignups.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta neutral">
              Direct Readers Joined
            </span>
            <span>in selected period</span>
          </div>
        </div>
      </div>

      {/* ── Paid vs. Organic Traffic Attribution ── */}
      <div className="an-split-box">
        <div className="an-split-head">
          <div className="an-split-title">
            <Ic k="funnel" s={16} /> TRAFFIC ATTRIBUTION · {rangeLabel.toUpperCase()}
          </div>
          <div className="an-attribution-layout">
          <div className="an-split-stats">
            <div className="an-split-stat">
              <span className="an-split-dot paid" />
              <span>
                <strong>Paid Ad Traffic:</strong> {paidPercentage}% ({rangeTotals.paidVisitors} visitors)
              </span>
            </div>
            <div className="an-split-stat">
              <span className="an-split-dot org" />
              <span>
                <strong>Organic Traffic:</strong> {organicPercentage}% ({rangeTotals.organicVisitors} visitors)
              </span>
            </div>
          </div>
          <div
            className={`an-donut${rangeTotals.visitors ? '' : ' is-empty'}`}
            role="img"
            aria-label={`Traffic attribution: ${paidPercentage}% paid ad traffic, ${organicPercentage}% organic traffic, ${rangeTotals.visitors} visitors`}
            style={{ '--paid-share': `${paidPercentage}%` } as React.CSSProperties}
            title={`Paid: ${paidPercentage}% | Organic: ${organicPercentage}%`}
          >
            <div className="an-donut-center">
              <strong>{rangeTotals.visitors.toLocaleString()}</strong>
              <span>visitors</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      <section className="an-card an-social-card" aria-labelledby="social-sources-title">
        <div className="an-social-heading">
          <div>
            <h2 id="social-sources-title" className="an-card-title"><Ic k="globe" s={21} /> Paid social traffic</h2>
            <p className="an-card-sub">Paid visits by platform and campaign, with outbound Amazon clicks for {rangeLabel.toLowerCase()}.</p>
          </div>
          <span className="an-social-total">{socialPlatformRows.reduce((sum, row) => sum + row.paidVisitors, 0).toLocaleString()} paid visits</span>
        </div>
        {socialPlatformRows.length ? (
          <div className="an-social-table-wrap">
            <table className="an-social-table">
              <thead>
                <tr><th>Platform</th><th>Paid visitors</th><th>Campaigns</th><th>Amazon clicks</th></tr>
              </thead>
              <tbody>
                {socialPlatformRows.map((row) => (
                  <tr key={row.name}>
                    <td><span className="an-social-platform-dot" />{row.name}</td>
                    <td>{row.paidVisitors.toLocaleString()}</td>
                    <td>{row.campaigns.size ? [...row.campaigns].join(', ') : 'Tagged source'}</td>
                    <td>{row.amazonClicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="an-social-empty">No paid social visits in this period yet. Use tagged ad links to see paid traffic by platform and campaign.</p>
        )}
        <p className="an-social-note">Only paid social visits are included here. Campaign names come from the ad link’s UTM tags.</p>
      </section>

      {/* ── Screen Output 2: 30-Day Interactive Chart & Secondary Distribution ── */}
      <div className="an-grid2">
        {/* Interactive 30-Day Area / Bar Chart */}
        <div className="an-card">
          <div className="an-card-head">
            <div>
              <h2 className="an-card-title">
                <Ic k="chart" s={22} /> {timeRange === 'today' ? 'Today' : `${rangeDays}-Day`} Paid vs. Organic Traffic
              </h2>
            <p className="an-card-sub">Compare daily visitors from paid campaigns with visitors from organic sources.</p>
            </div>
          </div>

          <div className="an-chart-container">
            {/* Hover Tooltip display */}
            {hoveredPoint && (
              <div className="an-chart-tooltip">
                <strong style={{ color: '#f7f2e8', fontSize: 13 }}>{hoveredPoint.date}</strong>
                <span style={{ color: '#86aaff', fontSize: 12 }}>
                  Paid visitors: <strong>{hoveredPoint.paidVisitors.toLocaleString()}</strong>
                </span>
                <span style={{ color: '#d7b66f', fontSize: 12 }}>
                  Organic visitors: <strong>{hoveredPoint.organicVisitors.toLocaleString()}</strong>
                </span>
                <span style={{ color: '#ded3c1', fontSize: 12 }}>
                  Total visitors: <strong>{hoveredPoint.visitors.toLocaleString()}</strong>
                </span>
                <span style={{ color: '#86efac', fontSize: 12 }}>
                  Amazon Clicks: <strong>{hoveredPoint.amazonClicks}</strong>
                </span>
                <span style={{ color: '#e8c48c', fontSize: 12 }}>
                  ARC Signups: <strong>{hoveredPoint.arcSignups}</strong>
                </span>
                {hoveredPoint.adNote && (
                  <span style={{ color: '#f59e0b', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                    ★ {hoveredPoint.adNote}
                  </span>
                )}
              </div>
            )}

            <div className="an-chart-legend" aria-hidden="true">
              <span><i className="an-legend-line" style={{ background: '#86aaff' }} /> Paid visitors</span>
              <span><i className="an-legend-line" style={{ background: '#d7b66f' }} /> Organic visitors</span>
              <span><i className="an-legend-promo" /> Campaign launch</span>
            </div>

            {/* Daily trend chart */}
            <svg
              className="an-chart-svg"
              viewBox="0 0 680 270"
              role="img"
              aria-label={`${rangeDays}-day paid and organic visitors trend`}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {[0, 0.5, 1].map((fraction) => {
                const y = 218 - fraction * 194;
                return (
                  <g key={fraction}>
                    <line x1="52" y1={y} x2="656" y2={y} className="an-chart-gridline" />
                    <text x="40" y={y + 4} textAnchor="end" className="an-chart-axis-label">
                      {Math.round(maxMetricVal * fraction)}
                    </text>
                  </g>
                );
              })}
              <path d={paidLinePath} fill="none" stroke="#86aaff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="an-chart-line paid" />
              <path d={organicLinePath} fill="none" stroke="#d7b66f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="an-chart-line organic" />
              {chartPoints.map(({ point, x, paidY, organicY }, index) => {
                const isPromo = !!point.adNote;
                const labelInterval = Math.max(1, Math.ceil(chartPoints.length / 4));
                const showDate = index === 0 || index === chartPoints.length - 1 || index % labelInterval === 0;
                return (
                  <g key={point.isoDate} onMouseEnter={() => setHoveredPoint(point)}>
                    {isPromo && <line x1={x} y1="24" x2={x} y2="218" className="an-chart-promo-guide" />}
                    {isPromo && <circle cx={x} cy={paidY} r="8" className="an-chart-promo-ring" />}
                    {isPromo && <circle cx={x} cy={organicY} r="8" className="an-chart-promo-ring" />}
                    <circle cx={x} cy={paidY} r={hoveredPoint?.isoDate === point.isoDate ? 5 : point.paidVisitors > 0 ? 4 : 2.5} fill="#86aaff" className="an-chart-point" />
                    <circle cx={x} cy={organicY} r={hoveredPoint?.isoDate === point.isoDate ? 5 : point.organicVisitors > 0 ? 4 : 2.5} fill="#d7b66f" className="an-chart-point" />
                    <circle cx={x} cy={paidY} r="11" fill="transparent" />
                    <circle cx={x} cy={organicY} r="11" fill="transparent" />
                    {showDate && (
                      <text x={x} y="250" textAnchor="middle" className="an-chart-axis-label">{point.date}</text>
                    )}
                    <title>{`${point.date}: ${point.paidVisitors} paid visitors, ${point.organicVisitors} organic visitors${point.adNote ? ` — ${point.adNote}` : ''}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top Visited Pages & Device Distribution */}
        <div className="an-card">
          <div>
            <h2 className="an-card-title">
              <Ic k="globe" s={20} /> Top Book Pages
            </h2>
            <p className="an-card-sub">Most visited sections across all campaigns</p>
          </div>

          <div className="an-dist-list">
            {topPages.map((p, index) => (
              <div key={p.page} className="an-dist-item">
                <div className="an-dist-row">
                  <span className="an-dist-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="an-dist-name">{p.page}</span>
                  <span className="an-dist-val">{p.percentage}% ({p.visits.toLocaleString()})</span>
                </div>
                <div className="an-dist-track">
                  <div className="an-dist-fill" style={{ width: `${p.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(239,231,214,0.08)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#9c8e7b' }}>Device Type Breakdown:</span>
              <span style={{ color: '#ded3c1' }}>Mobile: <strong>72%</strong> | Desktop: <strong>28%</strong></span>
            </div>
            <div className="an-progress-bar">
              <div className="an-progress-paid" style={{ width: '72%' }} title="72% Mobile" />
              <div className="an-progress-org" style={{ width: '28%' }} title="28% Desktop" />
            </div>
          </div>
        </div>
      </div>

      {/* Readers who joined from tracked marketing links */}
      <section className="an-card an-leads-card" aria-labelledby="campaign-leads-title">
        <div className="an-leads-heading">
          <div>
            <h2 id="campaign-leads-title" className="an-card-title">
              <Ic k="readers" s={21} /> Reader signups from your links
            </h2>
            <p className="an-card-sub">
              Emails people entered on the Advance Reader form, paired with the campaign that brought them here.
            </p>
          </div>
          <a className="crm-sm" href="/admin/readers">Open reader list</a>
        </div>

        <div className="an-leads-toolbar">
          <div className="an-leads-filters" role="group" aria-label="Filter reader signups by source">
            <button type="button" className={leadFilter === 'all' ? 'on' : ''} onClick={() => setLeadFilter('all')}>
              Everyone <span>{leadCounts.all}</span>
            </button>
            <button type="button" className={leadFilter === 'paid' ? 'on' : ''} onClick={() => setLeadFilter('paid')}>
              Paid ads <span>{leadCounts.paid}</span>
            </button>
            <button type="button" className={leadFilter === 'marketing' ? 'on' : ''} onClick={() => setLeadFilter('marketing')}>
              Organic & email <span>{leadCounts.marketing}</span>
            </button>
          </div>
          <label className="an-leads-search">
            <Ic k="mail" s={15} />
            <input
              aria-label="Search reader signups"
              placeholder="Find a reader or campaign"
              value={leadSearch}
              onChange={(event) => setLeadSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="an-leads-list" aria-live="polite">
          {filteredCampaignLeads.length ? filteredCampaignLeads.map((lead) => {
            const isPaid = isPaidMedium(lead.medium);
            const signupDate = lead.updatedAt || lead.createdAt;
            const initials = (lead.readerName || lead.readerEmail || 'Reader')
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase();

            return (
              <article className="an-lead-row" key={lead.id}>
                <div className="an-lead-person">
                  <span className="an-lead-avatar" aria-hidden="true">{initials}</span>
                  <div className="an-lead-identity">
                    <strong>{lead.readerName || 'New reader'}</strong>
                    <a href={`mailto:${lead.readerEmail}`}>{lead.readerEmail}</a>
                  </div>
                </div>
                <div className="an-lead-attribution">
                  <span className={`an-lead-source ${isPaid ? 'paid' : 'marketing'}`}>
                    {isPaid ? 'Paid ad' : 'Marketing'} <span aria-hidden="true">·</span> {lead.source}
                  </span>
                  <span className="an-lead-campaign">{lead.campaign}</span>
                </div>
                <time className="an-lead-date" dateTime={signupDate}>
                  {new Date(signupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </time>
              </article>
            );
          }) : (
            <div className="an-leads-empty">
              <span className="an-lead-empty-mark"><Ic k="readers" s={19} /></span>
              <div>
                <strong>{campaignLeads.length ? 'No signups match that search.' : 'No attributed signups yet.'}</strong>
                <p>{campaignLeads.length
                  ? 'Try another name, email address, or campaign.'
                  : 'When someone submits the form after arriving from a tracked link, their email and source will appear here.'}</p>
              </div>
            </div>
          )}
        </div>
        <p className="an-leads-foot">Showing form submissions from {rangeLabel.toLowerCase()}. A campaign is shown when the signup is linked to a tracked visit.</p>
      </section>

      {/* ── Screen Output 3: Advertising Campaign Leaderboard ── */}
      <div className="an-card">
        <div className="an-card-head">
          <div>
            <h2 className="an-card-title">
              <Ic k="target" s={22} /> Advertising & Organic Campaign Leaderboard
            </h2>
            <p className="an-card-sub">
              Comparative attribution showing which campaigns generated real Amazon purchases and ARC readers
            </p>
          </div>
        </div>

        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Channel & Type</th>
                <th style={{ textAlign: 'right' }}>Visitors</th>
                <th style={{ textAlign: 'right' }}>Amazon Clicks</th>
                <th style={{ textAlign: 'right' }}>ARC Signups</th>
                <th style={{ textAlign: 'right' }}>Conv. Rate</th>
                <th>Performance Insight</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.campaign}>
                  <td>
                    <strong style={{ color: '#f7f2e8', fontSize: 15 }}>{c.campaign}</strong>
                  </td>
                  <td>
                    <span className={`an-badge ${c.isPaid ? 'paid' : 'org'}`}>
                      {c.source} ({c.isPaid ? 'Paid Trail' : 'Organic Free'})
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                    {c.visitors.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#86efac', fontWeight: 700, fontVariantNumeric: 'lining-nums tabular-nums' }}>
                    {c.amazonClicks}
                  </td>
                  <td style={{ textAlign: 'right', color: '#e8c48c', fontWeight: 600, fontVariantNumeric: 'lining-nums tabular-nums' }}>
                    {c.arcSignups}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="an-badge success">
                      {c.conversionRate}%
                    </span>
                  </td>
                  <td style={{ color: '#b5a895', fontSize: 13 }}>
                    {c.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Screen Output 4: 1-Click Campaign Link Generator ── */}
      <div className="an-card">
        <div className="an-card-head">
          <div>
            <h2 className="an-card-title">
              <Ic k="link" s={22} /> 1-Click Campaign Tracking Link Generator
            </h2>
            <p className="an-card-sub">
              Generate 100% ad-blocker immune tracking links in 10 seconds. No manual UTM writing required.
            </p>
          </div>
          <button
            type="button"
            className="crm-sm"
            onClick={() => setShowHowToPaste(!showHowToPaste)}
          >
            {showHowToPaste ? 'Hide Paste Guide' : 'Where do I paste this?'}
          </button>
        </div>

        {showHowToPaste && (
          <div style={{ background: '#120f0d', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 4, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#b5a895', lineHeight: 1.5 }}>
            <strong style={{ color: '#93c5fd', fontSize: 14 }}>How to use this tracking link: {selectedLinkGuide.title}</strong>
            <div>{selectedLinkGuide.intro}</div>
            {selectedLinkGuide.steps.map((step, index) => (
              <div key={step.label}>
                <strong>{index + 1}. {step.label}:</strong> {step.detail}
              </div>
            ))}
          </div>
        )}

        <div className="crm-grid3">
          <div className="crm-field">
            <label className="crm-label">1. SELECT BOOK / DESTINATION</label>
            <select
              className="crm-in"
              value={selectedBookSlug}
              onChange={(e) => setSelectedBookSlug(e.target.value)}
            >
              <option value="home">Homepage & Showcase (/)</option>
              {books.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.title} (/books/{b.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="crm-field">
            <label className="crm-label">2. PLATFORM & CHANNEL PRESET</label>
            <select
              className="crm-in"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="instagram_ad">Instagram Paid Story / Reel Ad</option>
              <option value="instagram_bio">Instagram Profile Bio Link (Free)</option>
              <option value="facebook_ad">Facebook Newsfeed Paid Ad</option>
              <option value="bookbub_deal">BookBub Featured Deal / Ad</option>
              <option value="newsletter">Author Email Newsletter</option>
              <option value="tiktok_bio">TikTok Profile Bio Link</option>
              <option value="youtube">YouTube Channel / Video</option>
              <option value="pinterest">Pinterest Pin</option>
              <option value="linkedin">LinkedIn Post</option>
              <option value="x">X / Twitter Post</option>
              <option value="custom">Custom Marketing Channel</option>
            </select>
          </div>

          <div className="crm-field">
            <label className="crm-label">3. CAMPAIGN NAME</label>
            <input
              className="crm-in"
              placeholder="e.g. spring_launch_trailer"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>
        </div>

        <div className="an-gen-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif-c)', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: '#c9a860' }}>
              READY-TO-USE TRACKING LINK (COPY & PASTE INTO AD)
            </span>
            {copied && (
              <span className="an-badge success">
                <Ic k="check" s={14} /> COPIED TO CLIPBOARD!
              </span>
            )}
          </div>

          <div className="an-gen-preview">
            {generatedLink}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="crm-btn pri"
              onClick={copyToClipboard}
              style={{ padding: '0 28px' }}
            >
              <Ic k="copy" s={16} /> {copied ? 'COPIED TO CLIPBOARD' : 'COPY TRACKING LINK'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Screen Output 5: Live Visitor Journey Feed (Every Single User) ── */}
      <div className="an-card">
        <div className="an-card-head">
          <div>
            <h2 className="an-card-title">
              <Ic k="user" s={22} /> Live Individual Visitor Journey Feed
            </h2>
            <p className="an-card-sub">
              Click any visitor row to open their step-by-step clickstream timeline and inspect their journey
            </p>
          </div>

          {/* Action Filters */}
          <div className="crm-tabs">
            <button
              type="button"
              className={visitorFilter === 'all' ? 'on' : ''}
              onClick={() => setVisitorFilter('all')}
            >
              All Visitors ({initialSessions.length})
            </button>
            <button
              type="button"
              className={visitorFilter === 'amazon' ? 'on' : ''}
              onClick={() => setVisitorFilter('amazon')}
            >
              Clicked Amazon
            </button>
            <button
              type="button"
              className={visitorFilter === 'arc' ? 'on' : ''}
              onClick={() => setVisitorFilter('arc')}
            >
              ARC Signups
            </button>
            <button
              type="button"
              className={visitorFilter === 'paid' ? 'on' : ''}
              onClick={() => setVisitorFilter('paid')}
            >
              Paid Ads
            </button>
            <button
              type="button"
              className={visitorFilter === 'organic' ? 'on' : ''}
              onClick={() => setVisitorFilter('organic')}
            >
              Organic
            </button>
          </div>
        </div>

        {/* Search input */}
        <div style={{ maxWidth: 400 }}>
          <input
            className="crm-in"
            placeholder="Search by visitor ID, ad click ID, campaign, city..."
            value={visitorSearch}
            onChange={(e) => setVisitorSearch(e.target.value)}
          />
        </div>

        {/* Visitor Feed Table */}
        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Visitor ID</th>
                <th>Traffic Source & Campaign</th>
                <th>Location</th>
                <th>Device</th>
                <th>Journey & Key Outcome</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((v) => {
                const date = new Date(v.createdAt);
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const isPaid = isPaidMedium(v.medium);

                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: '#9c8e7b', fontVariantNumeric: 'lining-nums' }}>
                      {timeStr}
                    </td>
                    <td>
                      <span className="an-badge gold" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        #{v.id}
                      </span>
                      {v.adClickId && (
                        <span className="an-ad-click-id" title={`${v.adClickSource || 'Ad'} click ID: ${v.adClickId}`}>
                          {v.adClickSource || 'Ad'} · {v.adClickId.slice(0, 12)}{v.adClickId.length > 12 ? '…' : ''}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#f7f2e8', fontWeight: 600 }}>
                          {v.source} ({isPaid ? 'Paid Ad' : 'Organic'})
                        </span>
                        <span style={{ fontSize: 12, color: '#8c7e6c' }}>
                          Campaign: {v.campaign}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ic k="globe" s={14} />
                        <span>{v.location.city}, {v.location.country}</span>
                      </div>
                    </td>
                    <td>
                      <span className="an-badge muted">
                        {v.device} ({v.browser})
                      </span>
                    </td>
                    <td>
                      {v.exitOutcome === 'amazon_click' && (
                        <span className="an-badge success">
                          <Ic k="ext" s={14} /> [CLICKED AMAZON]
                        </span>
                      )}
                      {v.exitOutcome === 'arc_signup' && (
                        <span className="an-badge gold">
                          <Ic k="readers" s={14} /> [ARC SIGNUP{v.readerName ? `: ${v.readerName.split(' ')[0]}` : ''}]
                        </span>
                      )}
                      {v.exitOutcome === 'video_play' && (
                        <span className="an-badge paid">
                          <Ic k="video" s={14} /> [WATCHED TRAILER]
                        </span>
                      )}
                      {v.exitOutcome === 'browse' && (
                        <span className="an-badge muted">
                          {v.pageCount} pages browsed
                        </span>
                      )}
                      {v.exitOutcome === 'exit' && (
                        <span className="an-badge muted">
                          Exited ({v.durationSeconds}s)
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: '#c9a860', fontSize: 12, fontWeight: 600 }}>
                        View Journey →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Screen Output 6: Slide-Out Individual Visitor Clickstream Timeline Drawer ── */}
      {selectedVisitor && (
        <div className="an-drawer-overlay" onClick={() => setSelectedVisitor(null)}>
          <div className="an-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(239,231,214,0.08)', paddingBottom: 16 }}>
              <div>
                <span className="an-badge gold" style={{ fontFamily: 'monospace', fontSize: 13, marginBottom: 6 }}>
                  VISITOR #{selectedVisitor.id} PROFILE
                </span>
                <h3 style={{ margin: '4px 0 0', fontFamily: 'var(--serif-d)', fontSize: 24, color: '#f7f2e8' }}>
                  Complete Reader Clickstream
                </h3>
              </div>
              <button
                type="button"
                className="crm-header-toggle"
                onClick={() => setSelectedVisitor(null)}
                aria-label="Close drawer"
              >
                <Ic k="close" />
              </button>
            </div>

            {/* Visitor Attributes */}
            <div style={{ background: '#120f0d', border: '1px solid rgba(201,168,96,0.2)', padding: 18, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#8c7e6c' }}>Acquired Channel:</span>
                <span style={{ color: '#93c5fd', fontWeight: 600 }}>
                  {selectedVisitor.source} ({selectedVisitor.medium}) — {selectedVisitor.campaign}
                </span>
              </div>
              <div className="an-ad-click-detail">
                <span>Ad click ID:</span>
                {selectedVisitor.adClickId ? (
                  <code title={`${selectedVisitor.adClickSource || 'Ad'} click ID`}>
                    {selectedVisitor.adClickSource ? `${selectedVisitor.adClickSource} · ` : ''}{selectedVisitor.adClickId}
                  </code>
                ) : (
                  <span>No ad click ID was passed with this visit.</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#8c7e6c' }}>Geographic Location:</span>
                <span style={{ color: '#ded3c1' }}>
                  {selectedVisitor.location.city}, {selectedVisitor.location.region}, {selectedVisitor.location.country}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#8c7e6c' }}>Device & Platform:</span>
                <span style={{ color: '#ded3c1' }}>
                  {selectedVisitor.device} ({selectedVisitor.browser})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#8c7e6c' }}>Total Time on Site:</span>
                <span style={{ color: '#86efac', fontWeight: 700 }}>
                  {Math.floor(selectedVisitor.durationSeconds / 60)}m {selectedVisitor.durationSeconds % 60}s
                </span>
              </div>

              {/* Identity Bridge Banner if reader signed up */}
              {selectedVisitor.readerName && (
                <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(239,231,214,0.08)', background: 'rgba(201,168,96,0.1)', padding: 10, borderRadius: 4 }}>
                  <div style={{ color: '#c9a860', fontSize: 11, fontWeight: 700, letterSpacing: '.15em' }}>
                    ★ IDENTITY BRIDGED TO READER CRM:
                  </div>
                  <div style={{ color: '#f7f2e8', fontWeight: 600, fontSize: 14, marginTop: 2 }}>
                    {selectedVisitor.readerName} ({selectedVisitor.readerEmail})
                  </div>
                </div>
              )}
            </div>

            {/* Clickstream Timeline */}
            <div>
              <h4 style={{ fontFamily: 'var(--serif-c)', fontSize: 12, fontWeight: 700, letterSpacing: '.2em', color: '#c9a860', textTransform: 'uppercase', marginBottom: 14 }}>
                Chronological Clickstream Timeline
              </h4>

              <div className="an-timeline">
                {selectedVisitorEvents.length > 0 ? (
                  selectedVisitorEvents.map((e) => {
                    const timeStr = new Date(e.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    let nodeColor = '#c9a860';
                    let iconKey = 'link';

                    if (e.eventType === 'amazon_click') {
                      nodeColor = '#22c55e';
                      iconKey = 'ext';
                    } else if (e.eventType === 'arc_signup') {
                      nodeColor = '#f59e0b';
                      iconKey = 'readers';
                    } else if (e.eventType === 'video_play') {
                      nodeColor = '#3b82f6';
                      iconKey = 'video';
                    } else if (e.eventType === 'pageview') {
                      iconKey = 'books';
                    }

                    return (
                      <div key={e.id} className="an-tl-node">
                        <div
                          className="an-tl-icon"
                          style={{ '--node-color': nodeColor } as React.CSSProperties}
                        >
                          <Ic k={iconKey} s={16} />
                        </div>
                        <div className="an-tl-content">
                          <span className="an-tl-time">{timeStr}</span>
                          <span className="an-tl-title" style={{ color: e.eventType === 'amazon_click' ? '#86efac' : '#f7f2e8' }}>
                            {e.eventType === 'pageview' && `Visited ${e.pagePath}`}
                            {e.eventType === 'amazon_click' && `Clicked "BUY ON AMAZON" (${e.bookTitle || 'Book'})`}
                            {e.eventType === 'video_play' && `Watched Book Video Trailer`}
                            {e.eventType === 'arc_signup' && `Joined Advance Reader Team`}
                            {e.eventType === 'scroll_quote' && `Read Reviews & Chapter Sample`}
                          </span>
                          <p className="an-tl-desc">
                            {e.details || `Interacted on ${e.pagePath}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#8c7e6c', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>
                    Standard session recorded on {selectedVisitor.landingPage}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
