'use client';

import React, { useState, useTransition } from 'react';
import type { AdSettings, Book, SidebarAdItem, InArticleAdItem } from '@/lib/types';
import { defaultInArticleAd } from '@/lib/adConstants';
import { Ic } from './AdIcons';
import { saveAdSettingsAction } from '@/app/admin/actions';
import SidebarAdSlot from '@/components/ads/SidebarAdSlot';
import InArticleAdSlot from '@/components/ads/InArticleAdSlot';

interface Props {
  initialSettings: AdSettings;
  books: Book[];
}

export default function AdsManagerClient({ initialSettings, books }: Props) {
  const [settings, setSettings] = useState<AdSettings>({
    ...initialSettings,
    inArticleAd: initialSettings.inArticleAd || defaultInArticleAd,
  });
  const [activeTab, setActiveTab] = useState<'left' | 'right' | 'inArticle'>('left');
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const currentAd =
    activeTab === 'inArticle'
      ? (settings.inArticleAd || defaultInArticleAd)
      : activeTab === 'left'
      ? settings.leftAd
      : settings.rightAd;

  const updateCurrentAd = (patch: Partial<SidebarAdItem & InArticleAdItem>) => {
    setSettings((prev) => {
      if (activeTab === 'inArticle') {
        return {
          ...prev,
          inArticleAd: {
            ...(prev.inArticleAd || defaultInArticleAd),
            ...patch,
          },
        };
      }
      return {
        ...prev,
        [activeTab === 'left' ? 'leftAd' : 'rightAd']: {
          ...prev[activeTab === 'left' ? 'leftAd' : 'rightAd'],
          ...patch,
        },
      };
    });
  };

  const handleApplyBook = (bookId: string) => {
    const selected = books.find((b) => b.id === bookId || b.slug === bookId);
    if (!selected) return;

    updateCurrentAd({
      bookSlug: selected.slug,
      title: selected.title,
      coverImage: selected.cover || '',
      tagline: selected.tagline || (selected.description ? selected.description.slice(0, 90) + '...' : ''),
      badge:
        activeTab === 'left'
          ? '★ BESTSELLER'
          : activeTab === 'right'
          ? '⚡ NEW RELEASE'
          : '★ HISTORICAL SUSPENSE',
      label:
        activeTab === 'inArticle'
          ? 'RECOMMENDED NOVEL'
          : activeTab === 'left'
          ? 'FEATURED NOVEL'
          : 'SPONSORED',
      primaryBtnText: 'BUY ON AMAZON ↗',
      primaryBtnUrl: selected.amazonUrl || '#',
      secondaryBtnText: activeTab === 'inArticle' ? 'READ FREE SAMPLE' : 'READ SAMPLE',
      secondaryBtnUrl: `/books/${selected.slug}#sample`,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateCurrentAd({ coverImage: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await saveAdSettingsAction(settings);
      if (res.ok) {
        setStatusMsg({ type: 'ok', text: 'All ad configurations updated successfully! The changes are now live on your blog.' });
      } else {
        setStatusMsg({ type: 'err', text: res.error || 'Failed to save ad settings.' });
      }
    });
  };

  const inArticleConfig = settings.inArticleAd || defaultInArticleAd;

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── Top Header Controls ── */}
      <div className="crm-top">
        <div>
          <h1>Display &amp; In-Article Ads Manager</h1>
          <p>
            Configure the sidebar skyscraper ads and in-article recommendation banners displayed across your blog.
          </p>
        </div>
        <div className="crm-actions">
          <a href="/blog" target="_blank" rel="noopener noreferrer" className="crm-btn" title="View live blog with ads">
            <Ic k="ext" s={15} /> VIEW LIVE BLOG
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="crm-btn pri"
            title="Save changes and publish live"
          >
            <Ic k="check" s={16} sw={2} />
            {isPending ? 'SAVING ADS…' : 'SAVE ADS CONFIGURATION'}
          </button>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {statusMsg && (
        <div className={statusMsg.type === 'ok' ? 'crm-ok' : 'crm-err'} role="alert" style={{ marginBottom: 24 }}>
          <Ic k={statusMsg.type === 'ok' ? 'check' : 'trash'} s={18} sw={2} />
          <span><b>{statusMsg.type === 'ok' ? 'Success:' : 'Notice:'}</b> {statusMsg.text}</span>
        </div>
      )}

      {/* ── 3-Tab Switcher: Left Rail vs Right Rail vs In-Article Blog Ad ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('left')}
          className="crm-btn"
          style={{
            padding: '12px 20px',
            borderColor: activeTab === 'left' ? 'var(--gold)' : '#3a332b',
            background: activeTab === 'left' ? 'rgba(201,168,96,0.12)' : '#14100c',
            color: activeTab === 'left' ? 'var(--gold)' : 'var(--cream-2)',
            fontWeight: activeTab === 'left' ? 700 : 500,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>👈 LEFT SIDEBAR RAIL</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              background: settings.leftAd.enabled ? 'rgba(109,191,120,0.2)' : 'rgba(255,255,255,0.08)',
              color: settings.leftAd.enabled ? '#6dbf78' : 'var(--muted)',
            }}
          >
            {settings.leftAd.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('right')}
          className="crm-btn"
          style={{
            padding: '12px 20px',
            borderColor: activeTab === 'right' ? 'var(--gold)' : '#3a332b',
            background: activeTab === 'right' ? 'rgba(201,168,96,0.12)' : '#14100c',
            color: activeTab === 'right' ? 'var(--gold)' : 'var(--cream-2)',
            fontWeight: activeTab === 'right' ? 700 : 500,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>👉 RIGHT SIDEBAR RAIL</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              background: settings.rightAd.enabled ? 'rgba(109,191,120,0.2)' : 'rgba(255,255,255,0.08)',
              color: settings.rightAd.enabled ? '#6dbf78' : 'var(--muted)',
            }}
          >
            {settings.rightAd.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inArticle')}
          className="crm-btn"
          style={{
            padding: '12px 20px',
            borderColor: activeTab === 'inArticle' ? 'var(--gold)' : '#3a332b',
            background: activeTab === 'inArticle' ? 'rgba(201,168,96,0.12)' : '#14100c',
            color: activeTab === 'inArticle' ? 'var(--gold)' : 'var(--cream-2)',
            fontWeight: activeTab === 'inArticle' ? 700 : 500,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>📖 IN-ARTICLE AD (BLOG POSTS)</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              background: inArticleConfig.enabled ? 'rgba(109,191,120,0.2)' : 'rgba(255,255,255,0.08)',
              color: inArticleConfig.enabled ? '#6dbf78' : 'var(--muted)',
            }}
          >
            {inArticleConfig.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </button>
      </div>

      {/* ── Editor Layout: Settings Form (Left) & Live Preview (Right) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'inArticle' ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Form Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Status & Quick Fill */}
          <section className="crm-card">
            <h2>
              {activeTab === 'inArticle'
                ? 'In-Article Ad (Blog Post Body) Settings'
                : `${activeTab === 'left' ? 'Left rail' : 'Right rail'} ad settings`}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Enable / Disable Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#120f0d', border: '1px solid #3a332b', borderRadius: 6 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 14, color: currentAd.enabled ? '#6dbf78' : 'var(--muted)' }}>
                    {currentAd.enabled ? 'Ad is Active & Visible' : 'Ad is Disabled (Hidden)'}
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {activeTab === 'inArticle'
                      ? 'Toggle off to disable ads inside blog articles completely.'
                      : 'Toggle off to hide this sidebar ad rail from readers completely.'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  className="switch"
                  aria-checked={currentAd.enabled}
                  onClick={() => updateCurrentAd({ enabled: !currentAd.enabled })}
                  title={currentAd.enabled ? 'Disable Ad' : 'Enable Ad'}
                >
                  <span />
                </button>
              </div>

              {/* In-Article Specific: Paragraph Placement Setting */}
              {activeTab === 'inArticle' && (
                <div style={{ padding: '14px 16px', background: 'rgba(201,168,96,0.06)', border: '1px solid rgba(201,168,96,0.25)', borderRadius: 6 }}>
                  <label className="crm-label" htmlFor="insert-para" style={{ color: 'var(--gold)', marginBottom: 6 }}>
                    📖 INSERT AUTOMATICALLY AFTER PARAGRAPH
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <select
                      id="insert-para"
                      className="crm-in"
                      style={{ width: 190 }}
                      value={(currentAd as InArticleAdItem).insertAfterParagraph ?? 2}
                      onChange={(e) => updateCurrentAd({ insertAfterParagraph: parseInt(e.target.value, 10) || 2 })}
                    >
                      <option value={1}>After paragraph 1</option>
                      <option value={2}>After paragraph 2 (Recommended)</option>
                      <option value={3}>After paragraph 3</option>
                      <option value={4}>After paragraph 4</option>
                      <option value={5}>After paragraph 5</option>
                    </select>
                    <span style={{ fontSize: 13, color: 'var(--cream-2)' }}>
                      Only <b>1 ad</b> will appear inside each blog post.
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, display: 'block' }}>
                    💡 <b>Pro Tip:</b> You can also type <code>[ad]</code> on its own line in any blog post to manually position the ad wherever you want.
                  </span>
                </div>
              )}

              {/* 1-Click Fill From Book */}
              <div className="crm-field">
                <label className="crm-label">⚡ 1-CLICK AUTO-FILL FROM A NOVEL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    id="quick-fill-book"
                    className="crm-in"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleApplyBook(e.target.value);
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select a book to populate fields automatically...</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} {b.status === 'coming' ? '(Upcoming)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  Auto-populates title, book cover, blurb, and Amazon purchase link.
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Ad Copy & Content */}
          <section className="crm-card">
            <h2>Creative copy &amp; badges</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="crm-grid2">
                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-label">AD DISCLOSURE LABEL</label>
                  <input
                    id="ad-label"
                    type="text"
                    className="crm-in"
                    value={currentAd.label || ''}
                    onChange={(e) => updateCurrentAd({ label: e.target.value })}
                    placeholder="e.g. RECOMMENDED NOVEL, ADVERTISEMENT, SPONSORED"
                  />
                </div>

                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-badge">TOP BADGE</label>
                  <input
                    id="ad-badge"
                    type="text"
                    className="crm-in"
                    value={currentAd.badge || ''}
                    onChange={(e) => updateCurrentAd({ badge: e.target.value })}
                    placeholder="e.g. ★ BESTSELLER, ★ HISTORICAL SUSPENSE"
                  />
                </div>
              </div>

              <div className="crm-grid2">
                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-title">HEADLINE / TITLE</label>
                  <input
                    id="ad-title"
                    type="text"
                    className="crm-in"
                    value={currentAd.title || ''}
                    onChange={(e) => updateCurrentAd({ title: e.target.value })}
                    placeholder="Novel title or promo headline"
                  />
                </div>

                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-rating">STAR RATING</label>
                  <select
                    id="ad-rating"
                    className="crm-in"
                    value={currentAd.ratingStars ?? 5}
                    onChange={(e) => updateCurrentAd({ ratingStars: parseInt(e.target.value, 10) || 5 })}
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                  </select>
                </div>
              </div>

              {/* Tagline / Pitch */}
              <div className="crm-field">
                <label className="crm-label" htmlFor="ad-tagline">TAGLINE / HOOK / PITCH</label>
                <textarea
                  id="ad-tagline"
                  rows={2}
                  className="crm-in"
                  value={currentAd.tagline || ''}
                  onChange={(e) => updateCurrentAd({ tagline: e.target.value })}
                  placeholder="Short, gripping quote or blurb describing the book..."
                  style={{ height: 'auto', minHeight: 60 }}
                />
              </div>

              {/* Cover / Creative Image */}
              <div className="crm-field">
                <label className="crm-label" htmlFor="ad-cover">COVER / CREATIVE IMAGE URL</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    id="ad-cover"
                    type="text"
                    className="crm-in"
                    value={currentAd.coverImage || ''}
                    onChange={(e) => updateCurrentAd({ coverImage: e.target.value })}
                    placeholder="/img/covers/petticoats-and-ash.jpg or https://..."
                    style={{ flex: 1 }}
                  />
                  <label className="crm-btn" style={{ cursor: 'pointer' }}>
                    <Ic k="upload" s={14} /> UPLOAD IMAGE
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: Destination Links & Buttons */}
          <section className="crm-card">
            <h2>Call to action buttons &amp; links</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="crm-grid2">
                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-p-text">PRIMARY BUTTON TEXT</label>
                  <input
                    id="ad-p-text"
                    type="text"
                    className="crm-in"
                    value={currentAd.primaryBtnText || ''}
                    onChange={(e) => updateCurrentAd({ primaryBtnText: e.target.value })}
                    placeholder="e.g. BUY ON AMAZON ↗"
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-p-url">PRIMARY DESTINATION URL (AMAZON / STORE)</label>
                  <input
                    id="ad-p-url"
                    type="text"
                    className="crm-in"
                    value={currentAd.primaryBtnUrl || ''}
                    onChange={(e) => updateCurrentAd({ primaryBtnUrl: e.target.value })}
                    placeholder="https://www.amazon.com/dp/..."
                  />
                </div>
              </div>

              <div className="crm-grid2">
                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-s-text">SECONDARY BUTTON TEXT (OPTIONAL)</label>
                  <input
                    id="ad-s-text"
                    type="text"
                    className="crm-in"
                    value={currentAd.secondaryBtnText || ''}
                    onChange={(e) => updateCurrentAd({ secondaryBtnText: e.target.value })}
                    placeholder="e.g. READ FREE SAMPLE"
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-label" htmlFor="ad-s-url">SECONDARY DESTINATION URL</label>
                  <input
                    id="ad-s-url"
                    type="text"
                    className="crm-in"
                    value={currentAd.secondaryBtnUrl || ''}
                    onChange={(e) => updateCurrentAd({ secondaryBtnUrl: e.target.value })}
                    placeholder="/books/petticoats-and-ash#sample"
                  />
                </div>
              </div>

              {/* Raw HTML Mode (AdSense / Affiliate tags) */}
              <div className="crm-field" style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <label className="crm-label" htmlFor="ad-html">OPTIONAL: RAW HTML / ADSENSE SCRIPT TAG</label>
                <textarea
                  id="ad-html"
                  rows={3}
                  className="crm-in"
                  value={currentAd.customHtml || ''}
                  onChange={(e) => updateCurrentAd({ customHtml: e.target.value })}
                  placeholder="<!-- Paste Google AdSense or affiliate banner code here to override manual card -->"
                  style={{ fontFamily: 'monospace', fontSize: 12, height: 'auto', minHeight: 70 }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  If filled, this raw script will replace the standard card layout.
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Live Preview Column */}
        {activeTab === 'inArticle' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 90 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#120f0d', border: '1px solid #3a332b', borderRadius: 4 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.12em', color: 'var(--gold)', fontWeight: 600 }}>
                LIVE IN-ARTICLE PREVIEW (INSIDE BLOG POST)
              </span>
              <span style={{ fontSize: 11, color: currentAd.enabled ? '#6dbf78' : 'var(--muted)' }}>
                ● IN-ARTICLE AFTER PARAGRAPH {(currentAd as InArticleAdItem).insertAfterParagraph ?? 2}
              </span>
            </div>

            <div
              style={{
                background: '#0a0908',
                border: '1px dashed #3a332b',
                borderRadius: 6,
                padding: '24px',
                color: '#ded3c1',
                fontSize: 14,
                lineHeight: 1.7,
                fontFamily: 'var(--serif, Georgia, serif)',
              }}
            >
              <p style={{ margin: '0 0 16px', opacity: 0.65, fontStyle: 'italic' }}>
                &ldquo;Paragraph 1... In 1888, the mountain wind bit deeper than any bullet Ken had ever known. The trail wound through the pines, silent as the dead, carrying the whisper of old frontier debts.&rdquo;
              </p>
              <p style={{ margin: '0 0 16px', opacity: 0.65, fontStyle: 'italic' }}>
                &ldquo;Paragraph 2... He checked the iron sight of his rifle. If the record in the territorial register was true, the deed was buried deep in the ash of the old homestead.&rdquo;
              </p>

              {/* The in-article ad slot rendered live! */}
              <InArticleAdSlot adConfig={currentAd as InArticleAdItem} />

              <p style={{ margin: '16px 0 0', opacity: 0.65, fontStyle: 'italic' }}>
                &ldquo;Paragraph 3 continues... By nightfall, the fire died to embers, leaving only the sound of horses shifting nervously in the dark.&rdquo;
              </p>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              Appears automatically inside every <b>/blog/[slug]</b> article after paragraph {(currentAd as InArticleAdItem).insertAfterParagraph ?? 2}.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 90 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#120f0d', border: '1px solid #3a332b', borderRadius: 4 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--serif-c)', letterSpacing: '.12em', color: 'var(--gold)', fontWeight: 600 }}>
                LIVE 160 × 600 SKYSCRAPER PREVIEW
              </span>
              <span style={{ fontSize: 11, color: currentAd.enabled ? '#6dbf78' : 'var(--muted)' }}>
                ● {activeTab.toUpperCase()} RAIL
              </span>
            </div>

            <div
              style={{
                background: '#0a0908',
                border: '1px dashed #3a332b',
                borderRadius: 6,
                padding: '30px 20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minHeight: 650,
              }}
            >
              <SidebarAdSlot
                position={activeTab}
                adConfig={currentAd}
                label={currentAd.label || 'ADVERTISEMENT'}
              />
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              Appears on both <b>/blog</b> archive and all <b>/blog/[slug]</b> article pages.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
