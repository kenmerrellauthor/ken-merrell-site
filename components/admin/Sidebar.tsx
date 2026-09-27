'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Ic } from './AdIcons';
import { logout } from '@/app/admin/actions';

export default function Sidebar({ badge, email }: { badge: number; email: string }) {
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
      <div className="ad-mobilebar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Ken Merrell" />
        <button type="button" className="ad-sm icon" aria-label="Open admin menu" onClick={() => setOpen(true)}><Ic k="menu" /></button>
      </div>
      <aside className={`ad-side${open ? ' open' : ''}`}>
        <div className="ad-brand" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell" />
            <span>SITE ADMIN</span>
          </div>
          {open && <button type="button" className="ad-sm icon" aria-label="Close admin menu" onClick={() => setOpen(false)}><Ic k="close" /></button>}
        </div>
        <nav aria-label="Admin" className="ad-navlist">
          {items.map((it) => (
            <Link key={it.k} href={it.href} className={`ad-nav${it.on ? ' on' : ''}`} aria-current={it.on ? 'page' : undefined} onClick={() => setOpen(false)}>
              <span className="ic"><Ic k={it.k} /></span>{it.label}
              {!!it.badge && <span className="badge" title="New this week">{it.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="ad-foot">
          <a href="/" target="_blank" className="ad-nav"><span className="ic"><Ic k="ext" /></span>View live site</a>
          <form action={logout}>
            <button type="submit" className="ad-nav"><span className="ic"><Ic k="out" /></span>Sign out</button>
          </form>
          <div className="ad-me">
            <span className="av">KM</span>
            <span style={{ fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>Ken Merrell<small>{email}</small></span>
          </div>
        </div>
      </aside>
    </>
  );
}
