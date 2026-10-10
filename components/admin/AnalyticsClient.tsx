'use client';
import { useState, useMemo } from 'react';
import type { Book, AnalyticsKPIs, CampaignSummary, AnalyticsSession, AnalyticsEvent } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';
import { Ic } from './AdIcons';

interface AnalyticsClientProps {
  initialKpis: AnalyticsKPIs;
  dailyTraffic: DailyTrafficPoint[];
  campaigns: CampaignSummary[];
  topPages: Array<{ page: string; visits: number; percentage: number }>;
  initialSessions: AnalyticsSession[];
  initialEvents: AnalyticsEvent[];
  books: Book[];
}

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
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');
  const [metricTab, setMetricTab] = useState<'visitors' | 'amazon' | 'arc'>('visitors');
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrafficPoint | null>(null);

  // Link Generator State
  const [selectedBookSlug, setSelectedBookSlug] = useState<string>(books[0]?.slug || 'petticoats-and-ash');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram_ad');
  const [campaignName, setCampaignName] = useState<string>('spring_promo_trail');
  const [adContent, setAdContent] = useState<string>('cinematic_trailer_9x16');
  const [copied, setCopied] = useState(false);
  const [showHowToPaste, setShowHowToPaste] = useState(false);

  // Visitor Feed State
  const [visitorFilter, setVisitorFilter] = useState<'all' | 'amazon' | 'arc' | 'paid' | 'organic'>('all');
  const [visitorSearch, setVisitorSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<AnalyticsSession | null>(null);

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
      if (visitorFilter === 'paid' && !(s.medium.includes('ad') || s.medium === 'cpc')) return false;
      if (visitorFilter === 'organic' && (s.medium.includes('ad') || s.medium === 'cpc')) return false;

      if (visitorSearch.trim()) {
        const q = visitorSearch.toLowerCase();
        const matches =
          s.id.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          s.campaign.toLowerCase().includes(q) ||
          s.location.city.toLowerCase().includes(q) ||
          s.location.country.toLowerCase().includes(q) ||
          s.device.toLowerCase().includes(q) ||
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
  const maxMetricVal = useMemo(() => {
    return Math.max(
      ...dailyTraffic.map((d) => {
        if (metricTab === 'visitors') return d.visitors;
        if (metricTab === 'amazon') return d.amazonClicks;
        return d.arcSignups;
      }),
      10
    );
  }, [dailyTraffic, metricTab]);

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
          <p>First-party, cookieless advertising and campaign performance engine</p>
        </div>

        <div className="crm-actions">
          <div className="crm-tabs">
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
          </div>

          <button
            type="button"
            className="crm-btn"
            onClick={() => window.location.reload()}
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
            <span className="an-kpi-lbl">Today’s Viewers</span>
            <span className="an-kpi-icon"><Ic k="user" s={20} /></span>
          </div>
          <div className="an-kpi-val">{initialKpis.todayVisitors.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta pos">
              +{initialKpis.visitorsDeltaPct}%
            </span>
            <span>vs. yesterday ({initialKpis.yesterdayVisitors})</span>
          </div>
        </div>

        {/* Card 2: This Week Active Traffic */}
        <div className="an-kpi-card" style={{ '--card-accent': '#3b82f6' } as React.CSSProperties}>
          <div className="an-kpi-head">
            <span className="an-kpi-lbl">This Week</span>
            <span className="an-kpi-icon"><Ic k="target" s={20} /></span>
          </div>
          <div className="an-kpi-val">{initialKpis.thisWeekVisitors.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta info">
              Active Ads Running
            </span>
            <span>Meta & BookBub</span>
          </div>
        </div>

        {/* Card 3: Amazon Outbound Clicks */}
        <div className="an-kpi-card" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="an-kpi-head">
            <span className="an-kpi-lbl">Amazon Clicks</span>
            <span className="an-kpi-icon"><Ic k="ext" s={20} /></span>
          </div>
          <div className="an-kpi-val">{initialKpis.amazonClicks.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta pos">
              {initialKpis.amazonIntentRate}% Intent Rate
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
          <div className="an-kpi-val">{initialKpis.arcSignups.toLocaleString()}</div>
          <div className="an-kpi-foot">
            <span className="an-badge-delta neutral">
              Direct Readers Joined
            </span>
            <span>added to ARC team</span>
          </div>
        </div>
      </div>

      {/* ── Paid vs. Organic Traffic Split Pill Bar ── */}
      <div className="an-split-box">
        <div className="an-split-head">
          <div className="an-split-title">
            <Ic k="funnel" s={16} /> TRAFFIC ATTRIBUTION TODAY
          </div>
          <div className="an-split-stats">
            <div className="an-split-stat">
              <span className="an-split-dot paid" />
              <span>
                <strong>Paid Ad Traffic:</strong> {initialKpis.paidPercentage}% ({initialKpis.paidVisitors} visitors)
              </span>
            </div>
            <div className="an-split-stat">
              <span className="an-split-dot org" />
              <span>
                <strong>Organic Traffic:</strong> {initialKpis.organicPercentage}% ({initialKpis.organicVisitors} visitors)
              </span>
            </div>
          </div>
        </div>

        <div className="an-progress-bar" title={`Paid: ${initialKpis.paidPercentage}% | Organic: ${initialKpis.organicPercentage}%`}>
          <div className="an-progress-paid" style={{ width: `${initialKpis.paidPercentage}%` }} />
          <div className="an-progress-org" style={{ width: `${initialKpis.organicPercentage}%` }} />
        </div>
      </div>

      {/* ── Screen Output 2: 30-Day Interactive Chart & Secondary Distribution ── */}
      <div className="an-grid2">
        {/* Interactive 30-Day Area / Bar Chart */}
        <div className="an-card">
          <div className="an-card-head">
            <div>
              <h2 className="an-card-title">
                <Ic k="chart" s={22} /> 30-Day Traffic Trend & Promo Spikes
              </h2>
              <p className="an-card-sub">Hover over any bar to inspect daily visitor volume and campaign launches</p>
            </div>

            {/* Metric Switcher */}
            <div className="crm-tabs">
              <button
                type="button"
                className={metricTab === 'visitors' ? 'on' : ''}
                onClick={() => setMetricTab('visitors')}
              >
                Visitors
              </button>
              <button
                type="button"
                className={metricTab === 'amazon' ? 'on' : ''}
                onClick={() => setMetricTab('amazon')}
              >
                Amazon Clicks
              </button>
              <button
                type="button"
                className={metricTab === 'arc' ? 'on' : ''}
                onClick={() => setMetricTab('arc')}
              >
                ARC Signups
              </button>
            </div>
          </div>

          <div className="an-chart-container">
            {/* Hover Tooltip display */}
            {hoveredPoint && (
              <div className="an-chart-tooltip">
                <strong style={{ color: '#f7f2e8', fontSize: 13 }}>{hoveredPoint.date}</strong>
                <span style={{ color: '#93c5fd', fontSize: 12 }}>
                  Visitors: <strong>{hoveredPoint.visitors}</strong> ({hoveredPoint.paidVisitors} paid / {hoveredPoint.organicVisitors} org)
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

            {/* SVG Visual Bars */}
            <svg
              className="an-chart-svg"
              viewBox="0 0 600 240"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a860" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#7a5f25" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="spikeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

              {/* Bars */}
              {dailyTraffic.map((d, idx) => {
                const totalBars = dailyTraffic.length;
                const barWidth = 14;
                const gap = (600 - totalBars * barWidth) / (totalBars - 1);
                const x = idx * (barWidth + gap);

                let val = d.visitors;
                if (metricTab === 'amazon') val = d.amazonClicks;
                if (metricTab === 'arc') val = d.arcSignups;

                const barHeight = Math.max(6, (val / maxMetricVal) * 190);
                const y = 220 - barHeight;
                const isSpike = !!d.adNote;

                return (
                  <g key={d.isoDate}>
                    <rect
                      className="an-chart-bar"
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={3}
                      fill={isSpike ? 'url(#spikeGrad)' : 'url(#barGrad)'}
                      opacity={hoveredPoint?.isoDate === d.isoDate ? 1 : 0.85}
                      onMouseEnter={() => setHoveredPoint(d)}
                    />
                    {isSpike && (
                      <circle
                        cx={x + barWidth / 2}
                        cy={y - 6}
                        r={3.5}
                        fill="#60a5fa"
                        style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
                      />
                    )}
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
            {topPages.map((p) => (
              <div key={p.page} className="an-dist-item">
                <div className="an-dist-row">
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

        <div style={{ background: 'rgba(201,168,96,0.06)', border: '1px solid rgba(201,168,96,0.2)', padding: '14px 18px', borderRadius: 4, fontSize: 13, color: '#ded3c1', lineHeight: 1.5 }}>
          <strong style={{ color: '#c9a860' }}>Key Takeaway for Ken: </strong>
          BookBub delivered the highest volume of paperback & Kindle buyers on Amazon (215 clicks), while your free organic Instagram Bio link generated an exceptional 47.1% conversion rate with zero advertising spend.
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
            <strong style={{ color: '#93c5fd', fontSize: 14 }}>How to use this tracking link in Meta Ads Manager & Instagram:</strong>
            <div>
              <strong>1. Meta Ads Manager (Facebook/Instagram Ads):</strong> In your ad setup, paste this link directly into the <em>Website URL</em> box, or paste the parameter part (<code>utm_source=...</code>) into the <em>URL Parameters</em> box.
            </div>
            <div>
              <strong>2. Instagram Profile Bio:</strong> Go to your Instagram profile -&gt; <em>Edit Profile</em> -&gt; <em>Links</em> -&gt; paste the generated link so all profile clicks are credited to your organic bio.
            </div>
            <div>
              <strong>3. BookBub or Email Newsletter:</strong> Set this link as the destination for your email buttons or BookBub deal ads.
            </div>
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
            placeholder="Search by Visitor ID (#USR-8422), Campaign, City..."
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
                const isPaid = v.medium.includes('ad') || v.medium === 'cpc';

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
