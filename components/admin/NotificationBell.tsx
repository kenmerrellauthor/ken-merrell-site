'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { CrmNotification } from '@/lib/types';
import { markReadersSeenAction } from '@/app/admin/actions';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({
  notifications = [],
  unreadCount = 0,
  navItem = false,
  align = 'right',
}: {
  notifications: CrmNotification[];
  unreadCount: number;
  navItem?: boolean;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);
  const [items, setItems] = useState<CrmNotification[]>(notifications);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open]);

  // Sync props
  useEffect(() => {
    setUnread(unreadCount);
    setItems(notifications);
  }, [notifications, unreadCount]);

  async function handleMarkAllRead() {
    setUnread(0);
    setItems(prev => prev.map(n => ({ ...n, unread: false })));
    await markReadersSeenAction();
  }

  return (
    <div ref={panelRef} style={{ position: 'relative', display: navItem ? 'block' : 'inline-flex', alignItems: 'center' }}>
      {/* Trigger: Either Sidebar Nav Item or Standalone Button */}
      {navItem ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`ad-nav${open ? ' on' : ''}`}
          style={{ width: '100%' }}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          aria-expanded={open}
        >
          <span className="ic" style={{ color: unread > 0 ? 'var(--gold)' : undefined }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={unread > 0 ? 'rgba(201,168,96,.2)' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: unread > 0 ? 'kmBellRing 4s ease infinite' : 'none',
                transformOrigin: 'top center',
              }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          Notifications
          {unread > 0 && (
            <span className="badge" title={`${unread} unread notifications`}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          aria-expanded={open}
          className="ad-sm icon"
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 6,
            background: open ? 'rgba(201,168,96,.15)' : 'rgba(239,231,214,.04)',
            border: open ? '1px solid var(--gold)' : '1px solid rgba(239,231,214,.14)',
            color: unread > 0 ? 'var(--gold)' : 'var(--cream)',
            cursor: 'pointer',
            transition: 'all .15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="CRM Notifications"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={unread > 0 ? 'rgba(201,168,96,.2)' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: unread > 0 ? 'kmBellRing 4s ease infinite' : 'none',
              transformOrigin: 'top center',
            }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 17,
                height: 17,
                padding: '0 4px',
                borderRadius: 9,
                background: '#c9a860',
                color: '#15120f',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,.6)',
                border: '2px solid #0f0d0b',
              }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Dropdown Popover */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: navItem ? 0 : 'calc(100% + 10px)',
            left: navItem ? 'calc(100% + 10px)' : (align === 'left' ? 0 : 'auto'),
            right: navItem ? 'auto' : (align === 'left' ? 'auto' : 0),
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            background: '#15120f',
            border: '1px solid rgba(201,168,96,.3)',
            borderRadius: 8,
            boxShadow: '0 20px 48px rgba(0,0,0,.8), 0 0 24px rgba(201,168,96,.08)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 520,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: '#1a1612',
              borderBottom: '1px solid rgba(239,231,214,.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', color: 'var(--cream)', textTransform: 'uppercase', fontFamily: 'var(--serif-c)' }}>
                CRM Notifications
              </span>
              {unread > 0 && (
                <span style={{ background: 'rgba(201,168,96,.2)', color: 'var(--gold)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                  {unread} new
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  fontFamily: 'var(--serif-b)',
                }}
              >
                Mark read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
            {items.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6e6457" strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream-2)' }}>No notifications yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>New advance reader signups and book reviews will appear here.</div>
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 18px',
                    borderBottom: '1px solid rgba(239,231,214,.04)',
                    borderLeft: n.unread ? '3px solid var(--gold)' : '3px solid transparent',
                    background: n.unread ? 'rgba(201,168,96,.06)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all .15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,96,.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.unread ? 'rgba(201,168,96,.06)' : 'transparent'; }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: n.type === 'reader' ? 'rgba(74,136,88,.2)' : 'rgba(201,168,96,.2)',
                      color: n.type === 'reader' ? '#92c99f' : 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {n.type === 'reader' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                  </div>

                  {/* Text Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: n.unread ? 700 : 600, color: 'var(--cream)', lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      {n.unread && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.subtitle}
                    </div>
                    {n.detail && (
                      <div style={{ fontSize: 12, color: 'var(--soft)', fontStyle: 'italic', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        “{n.detail}”
                      </div>
                    )}
                    <span style={{ fontSize: 10, color: '#6e6457', marginTop: 4, display: 'block', letterSpacing: '.05em' }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer: Show All Notifications */}
          <div
            style={{
              padding: '12px 18px',
              background: '#100d0b',
              borderTop: '1px solid rgba(239,231,214,.08)',
              textAlign: 'center',
            }}
          >
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--gold)',
                textDecoration: 'none',
                letterSpacing: '.14em',
                fontFamily: 'var(--serif-c)',
                fontWeight: 700,
                padding: '4px 8px',
                transition: 'opacity .15s ease',
              }}
            >
              <span>SHOW ALL NOTIFICATIONS</span>
              <span style={{ fontSize: 13 }}>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
