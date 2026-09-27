'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookIc, Close, Menu } from './icons';

const LINKS = [
  { href: '/#books', label: 'Books', key: 'books' },
  { href: '/#coming', label: 'Coming soon', key: 'coming' },
  { href: '/#videos', label: 'Videos', key: 'videos' },
  { href: '/#about', label: 'About', key: 'about' },
  { href: '/#contact', label: 'Contact', key: 'contact' },
  { href: '/#advance', label: 'Advance readers', key: 'advance' }
];

export default function Header({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const cls = (k: string) => (k === active ? 'on' : undefined);
  return (
    <header className="site-header">
      <div className="bar">
        <nav aria-label="Primary left">
          <Link href="/#books" className={cls('books')}>BOOKS</Link>
          <Link href="/#coming" className={cls('coming')}>COMING SOON</Link>
          <Link href="/#videos" className={cls('videos')}>VIDEOS</Link>
        </nav>
        <Link href="/#advance" aria-label="Advance readers" className="icon-btn m-only left-slot" style={{ color: 'var(--gold)' }}>
          <BookIc s={20} />
        </Link>
        <Link href="/" aria-label="Ken Merrell home" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="Ken Merrell" width={250} height={58} />
        </Link>
        <nav aria-label="Primary right" className="right">
          <Link href="/#about" className={cls('about')}>ABOUT</Link>
          <Link href="/#contact" className={cls('contact')}>CONTACT</Link>
          <Link href="/#advance" className="cta">ADVANCE READERS</Link>
        </nav>
        <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>
      <div className="rule2" />
      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 34, width: 'auto' }} />
            <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}><Close /></button>
          </div>
          <nav aria-label="Mobile">
            <Link href="/books" onClick={() => setOpen(false)}>All books</Link>
            {LINKS.map((l) => (
              <Link key={l.key} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
