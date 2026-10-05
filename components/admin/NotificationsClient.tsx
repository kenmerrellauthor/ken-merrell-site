'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { CrmNotification } from '@/lib/types';
import { markReadersSeenAction } from '@/app/admin/actions';
import { Ic } from '@/components/admin/AdIcons';

function fmtRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function NotificationsClient({
  initialNotifications = [],
  initialUnreadCount = 0,
}: {
  initialNotifications: CrmNotification[];
  initialUnreadCount: number;
}) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [items, setItems] = useState<CrmNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<'all' | 'reader' | 'review' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [markedAll, setMarkedAll] = useState(false);

  // Sync props
  useEffect(() => {
    setItems(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  // Scroll to highlighted notification if present
  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(highlightId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId]);

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setItems(prev => prev.map(n => ({ ...n, unread: false })));
    setMarkedAll(true);
    await markReadersSeenAction();
  };

  const handleMarkSingle = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Stats
  const totalCount = items.length;
  const readerCount = items.filter(n => n.type === 'reader').length;
  const reviewCount = items.filter(n => n.type === 'review').length;
  const unreadAlerts = items.filter(n => n.unread).length;

  // Filtered and searched list
  const filtered = useMemo(() => {
    return items.filter(item => {
      // Tab filter
      if (filter === 'reader' && item.type !== 'reader') return false;
      if (filter === 'review' && item.type !== 'review') return false;
      if (filter === 'unread' && !item.unread) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSubtitle = item.subtitle.toLowerCase().includes(q);
        const inDetail = item.detail ? item.detail.toLowerCase().includes(q) : false;
        const inEmail = item.metadata?.email ? item.metadata.email.toLowerCase().includes(q) : false;
        const inBook = item.metadata?.bookTitle ? item.metadata.bookTitle.toLowerCase().includes(q) : false;
        if (!inTitle && !inSubtitle && !inDetail && !inEmail && !inBook) return false;
      }

      return true;
    });
  }, [items, filter, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Top Header ── */}
      <div className="crm-top">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1>CRM Notifications</h1>
            {unreadCount > 0 && (
              <span className="pill gold" style={{ height: 26, fontSize: 12, fontWeight: 700, padding: '0 12px' }}>
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p>Real-time live feed of advance reader signups, book reviews, and audience engagement.</p>
        </div>

        <div className="crm-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="crm-btn pri"
              onClick={handleMarkAllRead}
              title="Mark all notifications as read"
            >
              <Ic k="check" s={16} sw={2} />
              MARK ALL AS READ
            </button>
          )}
          <Link href="/admin/readers" className="crm-btn">
            <Ic k="readers" s={16} sw={1.8} />
            ADVANCE READERS CRM
          </Link>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="crm-stats">
        <div className="crm-stat">
          <span>TOTAL ALERTS</span>
          <b>{totalCount}</b>
        </div>
        <div className="crm-stat" style={{ borderLeft: unreadAlerts > 0 ? '3px solid var(--gold)' : undefined }}>
          <span>UNREAD ALERTS</span>
          <b style={{ color: unreadAlerts > 0 ? 'var(--gold)' : undefined }}>{unreadAlerts}</b>
        </div>
        <div className="crm-stat">
          <span>READER SIGNUPS</span>
          <b>{readerCount}</b>
        </div>
        <div className="crm-stat">
          <span>REVIEWS & FEEDBACK</span>
          <b>{reviewCount}</b>
        </div>
      </div>

      {markedAll && (
        <div className="crm-ok" role="status">
          <Ic k="check" s={16} sw={2} />
          All notifications have been marked as read.
        </div>
      )}

      {/* ── Filter Bar & Search ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <nav className="crm-tabs" aria-label="Filter notifications">
          <button
            type="button"
            className={filter === 'all' ? 'on' : ''}
            onClick={() => setFilter('all')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            className={filter === 'reader' ? 'on' : ''}
            onClick={() => setFilter('reader')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
          >
            Reader signups ({readerCount})
          </button>
          <button
            type="button"
            className={filter === 'review' ? 'on' : ''}
            onClick={() => setFilter('review')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
          >
            Reviews ({reviewCount})
          </button>
          <button
            type="button"
            className={filter === 'unread' ? 'on' : ''}
            onClick={() => setFilter('unread')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
          >
            Unread only ({unreadAlerts})
          </button>
        </nav>

        {/* Search Input */}
        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <input
            type="text"
            className="crm-in"
            style={{ height: 38, fontSize: 14, paddingLeft: 34 }}
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex', pointerEvents: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Notifications List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              background: '#1a1612',
              borderRadius: 6,
              border: '1px solid rgba(239,231,214,.08)',
              color: 'var(--muted)',
            }}
          >
            <div style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(201,168,96,.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--serif-d)', fontSize: 20, color: '#fff', marginBottom: 6 }}>
              {search ? 'No matching notifications' : 'No notifications in this view'}
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>
              {search ? 'Try clearing your search query.' : 'New notifications will appear here automatically when readers interact with your site.'}
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const isHighlighted = highlightId === n.id;
            return (
              <div
                key={n.id}
                id={n.id}
                style={{
                  background: n.unread ? 'rgba(201,168,96,.04)' : '#161310',
                  border: isHighlighted
                    ? '1.5px solid var(--gold)'
                    : n.unread
                    ? '1px solid rgba(201,168,96,.35)'
                    : '1px solid rgba(239,231,214,.08)',
                  borderRadius: 6,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                  transition: 'all .2s ease',
                  boxShadow: isHighlighted ? '0 0 20px rgba(201,168,96,.2)' : 'none',
                }}
              >
                {/* Type Icon Badge */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: n.type === 'reader' ? 'rgba(74,136,88,.15)' : 'rgba(201,168,96,.15)',
                    border: `1px solid ${n.type === 'reader' ? 'rgba(74,136,88,.4)' : 'rgba(201,168,96,.4)'}`,
                    color: n.type === 'reader' ? '#92c99f' : 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {n.type === 'reader' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--serif-d)', fontSize: 19, fontWeight: 600, color: '#fff' }}>
                        {n.title}
                      </span>
                      {n.unread && (
                        <span className="pill gold" style={{ height: 20, fontSize: 10, padding: '0 8px', letterSpacing: '.08em' }}>
                          NEW
                        </span>
                      )}
                      <span className={`pill ${n.type === 'reader' ? '' : 'off'}`} style={{ height: 20, fontSize: 10, padding: '0 8px', color: '#fff', background: 'rgba(255,255,255,0.1)' }}>
                        {n.type === 'reader' ? 'ADVANCE READER' : 'BOOK REVIEW'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fff' }} title={fmtFull(n.createdAt)}>
                      <span>{fmtRelative(n.createdAt)}</span>
                      <span>·</span>
                      <span>{fmtFull(n.createdAt)}</span>
                    </div>
                  </div>

                  {/* Subtitle / Metadata details */}
                  <div style={{ fontSize: 14, color: '#fff', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span>{n.subtitle}</span>
                    {n.metadata?.format && (
                      <span style={{ color: '#fff', fontSize: 12, padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                        {n.metadata.format}
                      </span>
                    )}
                  </div>

                  {n.detail && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.08)',
                        borderLeft: '3px solid var(--gold)',
                        borderRadius: '0 4px 4px 0',
                        fontSize: 14,
                        fontStyle: 'italic',
                        color: '#fff',
                        lineHeight: 1.6,
                      }}
                    >
                      “{n.detail}”
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    {n.type === 'reader' ? (
                      <>
                        <Link href="/admin/readers" className="crm-sm" style={{ fontSize: 13, height: 34 }}>
                          <Ic k="readers" s={14} /> View in Advance Readers CRM
                        </Link>
                        {n.metadata?.email && (
                          <a
                            href={`mailto:${n.metadata.email}?subject=Welcome to Ken Merrell Advance Readers`}
                            className="crm-sm"
                            style={{ fontSize: 13, height: 34 }}
                          >
                            <Ic k="mail" s={14} /> Email {n.metadata.readerName || 'Reader'}
                          </a>
                        )}
                      </>
                    ) : (
                      <Link
                        href={n.metadata?.bookId ? `/admin/books/${n.metadata.bookId}#reviews` : '/admin'}
                        className="crm-sm"
                        style={{ fontSize: 13, height: 34 }}
                      >
                        <Ic k="books" s={14} /> View Book Reviews
                      </Link>
                    )}

                    {n.unread && (
                      <button
                        type="button"
                        className="crm-sm icon"
                        style={{ height: 34, width: 34 }}
                        onClick={() => handleMarkSingle(n.id)}
                        title="Mark as read"
                      >
                        <Ic k="check" s={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
