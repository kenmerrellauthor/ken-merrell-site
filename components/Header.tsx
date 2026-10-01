'use client';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Close, Menu } from './icons';

const MOBILE_LINKS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/books', label: 'All Books', key: 'books' },
  { href: '/#coming', label: 'Coming Soon', key: 'coming' },
  { href: '/#videos', label: 'Videos', key: 'videos' },
  { href: '/author', label: 'About Ken', key: 'author' },
  { href: '/#contact', label: 'Contact', key: 'contact' },
  { href: '/advance-readers', label: 'Advance Readers', key: 'advance' }
];

export default function Header({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastYRef = useRef(0);

  // Ensure portal target is available after hydration
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);

    if (open) {
      // Store scroll position before locking (iOS Safari fix)
      const scrollY = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        // Restore scroll position when drawer closes
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        if (top) window.scrollTo(0, -parseInt(top, 10));
        window.removeEventListener('keydown', onKey);
      };
    }

    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const lastY = lastYRef.current;

      if (y <= 60) {
        setSticky(false);
        setHidden(false);
      } else if (y > lastY && y > 140) {
        setHidden(true);
      } else if (y < lastY) {
        setSticky(true);
        setHidden(false);
      }
      lastYRef.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cls = (k: string) => (k === active ? 'on' : undefined);

  // The mobile menu is portalled to <body> so it sits outside the header's
  // stacking context — its z-index: 9999 is global and nothing can render above it.
  const mobileMenu = open && (
    <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="top">
        <Link href="/" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="Ken Merrell" style={{ height: 34, width: 'auto' }} />
        </Link>
        <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}><Close /></button>
      </div>
      <nav aria-label="Mobile">
        {MOBILE_LINKS.map((l) => (
          <Link key={l.key} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <header className={`site-header${sticky ? ' is-sticky' : ''}${hidden ? ' is-hidden' : ''}`}>
        <div className="bar">
          <Link href="/" aria-label="Ken Merrell home" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Ken Merrell" width={240} height={56} />
          </Link>
          <nav aria-label="Primary navigation" className="nav-links">
            <Link href="/books" className={cls('books')}>BOOKS</Link>
            <Link href="/#coming" className={cls('coming')}>COMING SOON</Link>
            <Link href="/#videos" className={cls('videos')}>VIDEOS</Link>
            <Link href="/author" className={cls('author')}>AUTHOR</Link>
            <Link href="/#contact" className={cls('contact')}>CONTACT</Link>
          </nav>
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </div>
        <div className="rule2" />
      </header>
      {/* Portal: renders mobile menu directly into <body> — outside all stacking contexts */}
      {mounted && open && mobileMenu ? createPortal(mobileMenu, document.body) : null}
    </>
  );
}
