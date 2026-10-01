'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const soon = path === '/admin' && sp.get('tab') === 'soon';
  const items = [
    { href: '/admin', k: 'books', label: 'Books', on: (path === '/admin' && !soon) || path.startsWith('/admin/books') },
    { href: '/admin?tab=soon', k: 'soon', label: 'Coming soon', on: soon },
    { href: '/admin/videos', k: 'video', label: 'Videos', on: path.startsWith('/admin/videos') },
    { href: '/admin/about', k: 'user', label: 'Author & bio', on: path.startsWith('/admin/about') },
    { href: '/admin/readers', k: 'readers', label: 'Advance readers', on: path.startsWith('/admin/readers'), badge }
  ];

  return (
    <>
      {/* ── Top Bar across the entire admin ── */}
      <header className="ad-topbar">
        {/* Left: Mobile toggle & Ken CRM brand logo */}
        <div className="ad-topbar-left">
          <button
            type="button"
            className="ad-sm icon ad-mobile-toggle"
            aria-label={open ? 'Close admin menu' : 'Open admin menu'}
            onClick={() => setOpen(!open)}
          >
            <Ic k={open ? 'close' : 'menu'} />
          </button>
          <Link href="/admin" className="ad-topbar-brand" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell" />
            <span className="ad-topbar-tag">SITE ADMIN</span>
          </Link>
        </div>

        {/* Right: In a straight line to the opposite side of the Ken CRM logo */}
        <div className="ad-topbar-right">
          <a href="/" target="_blank" className="ad-topbar-link" title="Open live site in new tab">
            <Ic k="ext" s={14} />
            <span>Live site</span>
          </a>
          <NotificationBell notifications={notifications} unreadCount={unreadCount} align="right" />
          <div className="ad-topbar-user">
            <span className="av">KM</span>
            <div className="ad-topbar-user-info">
              <span className="ad-topbar-user-name">Ken Merrell</span>
              <small>{email}</small>
            </div>
          </div>
        </div>
      </header>

      {/* ── Admin Body: Sidebar navigation + Main page content ── */}
      <div className="ad-body">
        <aside className={`ad-side${open ? ' open' : ''}`}>
          <nav aria-label="Admin" className="ad-navlist">
            {items.map((it) => (
              <Link
                key={it.k}
                href={it.href}
                className={`ad-nav${it.on ? ' on' : ''}`}
                aria-current={it.on ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="ic"><Ic k={it.k} /></span>{it.label}
                {!!it.badge && <span className="badge" title="New this week">{it.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="ad-foot">
            <form action={logout}>
              <button type="submit" className="ad-nav">
                <span className="ic"><Ic k="out" /></span>Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="ad-main">{children}</main>
      </div>
    </>
  );
}
