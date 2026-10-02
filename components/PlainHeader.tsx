'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PlainHeader({ active = 'books' }: { active?: string }) {
  const pathname = usePathname();
  const [currentActive, setCurrentActive] = useState<string>(active);

  useEffect(() => {
    if (pathname.startsWith('/books')) setCurrentActive('books');
    else if (pathname === '/author') setCurrentActive('author');
    else setCurrentActive('');
  }, [pathname]);

  const cls = (k: string) => (k === currentActive ? 'on' : undefined);

  return (
    <header className="plain-header">
      <Link href="/" aria-label="Ken Merrell home" style={{ display: 'flex' }} onClick={() => setCurrentActive('')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Ken Merrell" width={190} height={44} />
      </Link>
      <nav aria-label="Main">
        <Link href="/" className={cls('home')} onClick={() => setCurrentActive('home')}>HOME</Link>
        <Link href="/books" className={cls('books')} aria-current={currentActive === 'books' ? 'page' : undefined} onClick={() => setCurrentActive('books')}>ALL BOOKS</Link>
        <Link href="/#coming" className={cls('coming')} onClick={() => setCurrentActive('coming')}>COMING SOON</Link>
        <Link href="/author" className={cls('author')} onClick={() => setCurrentActive('author')}>AUTHOR</Link>
        <Link href="/#contact" className={cls('contact')} onClick={() => setCurrentActive('contact')}>CONTACT</Link>
      </nav>
      <Link href="/" className="back m-only" style={{ alignItems: 'center' }} onClick={() => setCurrentActive('')}>HOME</Link>
    </header>
  );
}
