'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Book, CampaignSummary, AnalyticsSession, AnalyticsEvent } from '@/lib/types';
import type { DailyTrafficPoint } from '@/lib/seedAnalytics';
import { Ic } from '../AdIcons';
import { RangeTabs, cleanLocation, isPaidMedium, rangeDaysOf, rangeLabelOf, windowStartOf, parseDateBoundary, type TimeRange } from './shared';

/** Number of visitors shown per "page" in the journey feed. */
const FEED_PAGE_SIZE = 30;

interface AdTrackingClientProps {
  dailyTraffic: DailyTrafficPoint[];
  campaigns: CampaignSummary[];
  initialSessions: AnalyticsSession[];
  initialEvents: AnalyticsEvent[];
  books: Book[];
}

export default function AdTrackingClient({
  dailyTraffic,
  campaigns,
  initialSessions,
  initialEvents,
  books,
}: AdTrackingClientProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const handleRangeChange = (range: TimeRange, start?: string, end?: string) => {
    setTimeRange(range);
    if (range === 'custom') {
      const s = start || new Date().toISOString().slice(0, 10);
      const e = end || s;
      setCustomStart(s);
      setCustomEnd(e);
    } else {
      setCustomStart('');
      setCustomEnd('');
    }
  };

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
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE);
  const [leadFilter, setLeadFilter] = useState<'all' | 'paid' | 'marketing'>('all');
  const [leadSearch, setLeadSearch] = useState('');

  // Reset the feed back to the first 30 whenever the filter or search changes.
  useEffect(() => {
    setVisibleCount(FEED_PAGE_SIZE);
  }, [visitorFilter, visitorSearch]);

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

  // Date window shared by visitor feed, paid-social table, and reader signups list
  const rangeDays = rangeDaysOf(timeRange, customStart, customEnd);
  const visibleTraffic = useMemo(() => {
    if (timeRange === 'custom' && customStart) {
      const startDay = customStart.slice(0, 10);
      const endDay = (customEnd || customStart).slice(0, 10);
      const filtered = dailyTraffic.filter((p) => p.isoDate >= startDay && p.isoDate <= endDay);
      if (filtered.length > 0) return filtered;
    }
    return dailyTraffic.slice(-rangeDays);
  }, [dailyTraffic, timeRange, rangeDays, customStart, customEnd]);

  const rangeLabel = rangeLabelOf(timeRange, customStart, customEnd);

  const leadWindowStart = useMemo(() => {
    if (timeRange === 'custom' && customStart) {
      return parseDateBoundary(customStart, false);
    }
    return windowStartOf(visibleTraffic);
  }, [timeRange, customStart, visibleTraffic]);

  const leadWindowEnd = useMemo(() => {
    if (timeRange === 'custom' && customStart) {
      return parseDateBoundary(customEnd || customStart, true);
    }
    return Date.now();
  }, [timeRange, customStart, customEnd]);

  // Filtered visitor list (respects date range, filters, and search)
  const filteredVisitors = useMemo(() => {
    return initialSessions.filter((s) => {
      const createdAt = new Date(s.createdAt).getTime();
      if (createdAt < leadWindowStart || createdAt > leadWindowEnd) return false;

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
  }, [initialSessions, leadWindowStart, leadWindowEnd, visitorFilter, visitorSearch]);

  // Reset pagination when filter or date range changes
  useEffect(() => {
    setVisibleCount(FEED_PAGE_SIZE);
  }, [timeRange, customStart, customEnd, visitorFilter, visitorSearch]);

  // Clickstream events for selected visitor
  const selectedVisitorEvents = useMemo(() => {
    if (!selectedVisitor) return [];
    return initialEvents
      .filter((e) => e.sessionId === selectedVisitor.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedVisitor, initialEvents]);

  const socialPlatformRows = useMemo(() => {
    const platformNames: Record<string, string> = {
      instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube',
      pinterest: 'Pinterest', linkedin: 'LinkedIn', x: 'X', twitter: 'X', threads: 'Threads',
      reddit: 'Reddit', snapchat: 'Snapchat',
    };
    const totals = new Map<string, { name: string; paidVisitors: number; campaigns: Set<string>; amazonClicks: number }>();

    initialSessions.forEach((session) => {
      const createdAt = new Date(session.createdAt).getTime();
      if (createdAt < leadWindowStart || createdAt > leadWindowEnd) return;
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
  }, [initialSessions, leadWindowStart, leadWindowEnd]);

  const campaignLeads = useMemo(() => initialSessions
    .filter((session) => session.exitOutcome === 'arc_signup' && Boolean(session.readerEmail?.trim()))
    .filter((session) => {
      const t = new Date(session.updatedAt || session.createdAt).getTime();
      return t >= leadWindowStart && t <= leadWindowEnd;
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()),
  [initialSessions, leadWindowStart, leadWindowEnd]);

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

  // Paginated slice of the visitor feed (30 at a time)
  const shownVisitors = useMemo(() => filteredVisitors.slice(0, visibleCount), [filteredVisitors, visibleCount]);
  const hasMoreVisitors = visibleCount < filteredVisitors.length;

  return (
    <div className="an-container">
      {/* ── Top Header Controls ── */}
      <div className="crm-top">
        <div>
          <div className="crumb">
            <span>Ken Merrell Platform</span>
            <span>/</span>
            <span>Advertising</span>
          </div>
          <h1>Ad Tracking</h1>
          <p>Build tracking links, compare campaigns, and follow every visitor’s journey through the site.</p>
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
              <option value="home">Home (Homepage & Showcase)</option>
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

        {/* Search input + result counter */}
        <div className="an-feed-toolbar">
          <div style={{ maxWidth: 400, flex: '1 1 280px' }}>
            <input
              id="visitor-feed-search"
              className="crm-in"
              placeholder="Search by visitor ID, ad click ID, campaign, city..."
              value={visitorSearch}
              onChange={(e) => setVisitorSearch(e.target.value)}
            />
          </div>
          <span className="an-feed-count" aria-live="polite">
            Showing <strong>{shownVisitors.length.toLocaleString()}</strong> of{' '}
            <strong>{filteredVisitors.length.toLocaleString()}</strong> visitors
          </span>
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
              {shownVisitors.map((v) => {
                const date = new Date(v.createdAt);
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isPaid = isPaidMedium(v.medium);

                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: '#9c8e7b', fontVariantNumeric: 'lining-nums', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'block', color: '#ded3c1', fontSize: 12 }}>{dateStr}</span>
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
                        <span>{cleanLocation(v.location.city, v.location.region, v.location.country)}</span>
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
                      <button
                        type="button"
                        className="an-view-journey-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                      >
                        <span>View Journey</span>
                        <span className="an-btn-arrow">→</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {shownVisitors.length === 0 && (
                <tr>
                  <td colSpan={7} className="an-feed-empty">
                    {initialSessions.length
                      ? 'No visitors match this filter or search.'
                      : 'No visitors have been tracked yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load the next 30 visitors */}
        {hasMoreVisitors && (
          <div className="an-feed-more">
            <button
              type="button"
              id="visitor-feed-load-more"
              className="crm-btn"
              onClick={() => setVisibleCount((count) => count + FEED_PAGE_SIZE)}
            >
              Load more
              <span className="an-feed-more-hint">
                next {Math.min(FEED_PAGE_SIZE, filteredVisitors.length - visibleCount)} of {(filteredVisitors.length - visibleCount).toLocaleString()} remaining
              </span>
            </button>
          </div>
        )}
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
                  {cleanLocation(selectedVisitor.location.city, selectedVisitor.location.region, selectedVisitor.location.country)}
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
