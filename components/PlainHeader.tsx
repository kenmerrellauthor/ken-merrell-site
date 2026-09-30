import Link from 'next/link';

export default function PlainHeader({ active }: { active?: 'books' }) {
  return (
    <header className="plain-header">
      <Link href="/" aria-label="Ken Merrell home" style={{ display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo.png" alt="Ken Merrell" width={190} height={44} />
      </Link>
      <nav aria-label="Main">
        <Link href="/">HOME</Link>
        <Link href="/books" className={active === 'books' ? 'on' : undefined} aria-current={active === 'books' ? 'page' : undefined}>ALL BOOKS</Link>
        <Link href="/#coming">COMING SOON</Link>
        <Link href="/author">AUTHOR</Link>
        <Link href="/#contact">CONTACT</Link>
      </nav>
      <Link href="/" className="back m-only" style={{ alignItems: 'center' }}>HOME</Link>
    </header>
  );
}
