'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Ic } from './AdIcons';
import { logout } from '@/app/admin/actions';
import NotificationBell from './NotificationBell';
import type { CrmNotification } from '@/lib/types';

export default function Sidebar({
  badge,
  email,
  notifications = [],
  unreadCount = 0,
  children,
}: {
  badge: number;
  email: string;
  notifications?: CrmNotification[];
  unreadCount?: number;
  children?: React.ReactNode;
}) {
  const path = usePathname();
  const sp = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.crm-topbar-user-wrap')) {
        setUserMenuOpen(false);
      }
    };
    // small delay so the toggle click doesn't instantly close it
    setTimeout(() => window.addEventListener('click', onClick), 0);
    return () => window.removeEventListener('click', onClick);
  }, [userMenuOpen]);

  // Load saved desktop collapse preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('km_admin_sidebar_collapsed');
      if (saved === 'true') setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close mobile drawer on path / query change
  useEffect(() => {
    setMobileOpen(false);
  }, [path, sp]);

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 980) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('km_admin_sidebar_collapsed', String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
  };

  const items = [
    { href: '/admin', k: 'books', label: 'Books', on: path === '/admin' || path.startsWith('/admin/books') },
    { href: '/admin/videos', k: 'video', label: 'Videos', on: path.startsWith('/admin/videos') },
    { href: '/admin/about', k: 'user', label: 'Author & bio', on: path.startsWith('/admin/about') },
    { href: '/admin/readers', k: 'readers', label: 'Advance readers', on: path.startsWith('/admin/readers'), badge },
    { href: '/admin/analytics', k: 'chart', label: 'Ad Tracking & Analytics', on: path.startsWith('/admin/analytics') }
  ];

  return (
    <>
      {/* ── Top Bar across the entire admin ── */}
      <header className="crm-topbar">
        {/* Left: 2-bar menu toggle & Ken CRM brand logo */}
        <div className="crm-topbar-left">
          <button
            type="button"
            className="crm-header-toggle"
            aria-label={mobileOpen ? 'Close admin menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={mobileOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={handleToggle}
          >
            <Ic k={mobileOpen ? 'close' : 'menu'} />
          </button>
          <Link href="/admin" className="crm-topbar-brand" onClick={() => setMobileOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell" />
            <span className="crm-topbar-tag">SITE ADMIN</span>
          </Link>
        </div>

        {/* Right: In a straight line to the opposite side of the Ken CRM logo */}
        <div className="crm-topbar-right">
          <a href="/" target="_blank" className="crm-topbar-link" title="Open live site in new tab">
            <Ic k="ext" s={14} />
            <span>Live site</span>
          </a>
          <NotificationBell notifications={notifications} unreadCount={unreadCount} align="right" />
          <div className="crm-topbar-user-wrap" style={{ position: 'relative' }}>
            <button
              type="button"
              className="crm-topbar-user"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              onClick={() => setUserMenuOpen((p) => !p)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <span className="av">KM</span>
              <div className="crm-topbar-user-info">
                <span className="crm-topbar-user-name">Ken Merrell</span>
                <small>{email}</small>
              </div>
            </button>
            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: '#120f0d', border: '1px solid #3a332b', borderRadius: 6,
                  padding: '6px', minWidth: 180, zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}
              >
                <form action={logout}>
                  <button
                    type="submit"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      background: 'none', border: 'none', color: 'var(--cream)',
                      cursor: 'pointer', padding: '8px 12px', borderRadius: 4,
                      fontSize: 14, textAlign: 'left', transition: 'background .15s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Ic k="out" s={14} />
                    <span>Sign out</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="crm-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Admin Body: Sidebar navigation + Main page content ── */}
      <div className="crm-body">
        <aside className={`crm-side${mobileOpen ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
          {/* Mobile drawer header with close button */}
          <div className="crm-side-mobile-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 26, width: 'auto' }} />
              <span style={{ fontFamily: 'var(--serif-c)', fontSize: 10, fontWeight: 700, letterSpacing: '.2em', color: 'var(--gold)' }}>
                ADMIN MENU
              </span>
            </div>
            <button
              type="button"
              className="crm-sm icon"
              aria-label="Close admin menu"
              onClick={() => setMobileOpen(false)}
              style={{ width: 34, height: 34 }}
            >
              <Ic k="close" s={16} />
            </button>
          </div>

          <nav aria-label="Admin" className="crm-navlist">
            {items.map((it) => (
              <Link
                key={it.k}
                href={it.href}
                className={`crm-nav${it.on ? ' on' : ''}`}
                aria-current={it.on ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
                title={it.label}
              >
                <span className="ic"><Ic k={it.k} /></span>
                <span className="crm-nav-label">{it.label}</span>
                {!!it.badge && <span className="badge" title="New this week">{it.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="crm-foot">
            <form action={logout}>
              <button type="submit" className="crm-nav" title="Sign out">
                <span className="ic"><Ic k="out" /></span>
                <span className="crm-nav-label">Sign out</span>
              </button>
            </form>
          </div>
        </aside>

        <main className="crm-main">{children}</main>
      </div>
    </>
  );
}
