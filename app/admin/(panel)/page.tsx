import Link from 'next/link';
import { Ic } from '@/components/admin/AdIcons';
import { Cover } from '@/components/Bits';
import { getBooks, getReaders, getVideos } from '@/lib/store';
import { deleteBookAction, moveBook, toggleBookStatus } from '../actions';
import { DeleteButton } from '@/components/admin/DeleteButton';

const COLS = '44px 76px minmax(0, 1fr) 140px 170px 210px';

export default async function BooksAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab || 'all';
  const [books, videos, readers] = await Promise.all([getBooks(), getVideos(), getReaders()]);
  const live = books.filter((b) => b.status === 'available');
  const soon = books.filter((b) => b.status === 'coming');
  const rows = tab === 'live' ? live : tab === 'soon' ? soon : books;
  const week = Date.now() - 7 * 86_400_000;
  const liveIndex = (id: string) => live.findIndex((b) => b.id === id) + 1;

  return (
    <>
      <div className="ad-top">
        <div>
          <h1>Books</h1>
          <p>Add a book, edit its page, or move it from Coming soon to Available when it launches.</p>
        </div>
        <div className="ad-actions">
          <Link href="/admin/books/new" className="ad-btn pri"><Ic k="plus" s={16} sw={1.8} />ADD A BOOK</Link>
        </div>
      </div>

      <div className="ad-stats">
        <div className="ad-stat"><span>AVAILABLE</span><b>{live.length}</b></div>
        <div className="ad-stat"><span>COMING SOON</span><b>{soon.length}</b></div>
        <div className="ad-stat"><span>VIDEOS</span><b>{videos.filter((v) => v.youtubeId).length}</b></div>
        <div className="ad-stat"><span>NEW READER SIGNUPS</span><b>{readers.filter((r) => new Date(r.createdAt).getTime() > week).length}</b></div>
      </div>

      <nav className="ad-tabs" aria-label="Filter books">
        <Link href="/admin" className={tab === 'all' ? 'on' : ''}>All books ({books.length})</Link>
        <Link href="/admin?tab=live" className={tab === 'live' ? 'on' : ''}>Available ({live.length})</Link>
        <Link href="/admin?tab=soon" className={tab === 'soon' ? 'on' : ''}>Coming soon ({soon.length})</Link>
      </nav>

      <div className="ad-table">
        <div className="ad-tr head" style={{ gridTemplateColumns: COLS }}>
          <span>ORDER</span><span>COVER</span><span>TITLE</span><span>LINKS</span><span>STATUS</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        {rows.length === 0 && <div style={{ padding: 28, color: 'var(--muted)' }}>Nothing here yet.</div>}
        {rows.map((b) => {
          const i = books.findIndex((x) => x.id === b.id);
          const on = b.status === 'available';
          const needs = [!b.cover && 'Needs cover', !b.sample.trim() && on && 'No sample', !b.amazonUrl && on && 'No Amazon link'].filter(Boolean).join(' · ');
          return (
            <div key={b.id} className="ad-tr row" style={{ gridTemplateColumns: COLS, height: 104 }}>
              <div className="movers">
                <form action={moveBook}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={i === 0} aria-label={`Move ${b.title} up`}><Ic k="caretUp" s={16} /></button></form>
                <form action={moveBook}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={i === books.length - 1} aria-label={`Move ${b.title} down`}><Ic k="caretDown" s={16} /></button></form>
              </div>
              <div className="ad-thumb"><Cover book={b} w={52} h={78} title={9} author={5} /><div className="km-spine abs" /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span className="ad-title">{b.title}</span>
                <span className="ad-meta">
                  {on ? `No. ${String(liveIndex(b.id)).padStart(2, '0')}` : `Expected ${b.releaseLabel || 'date not set'}`}
                  {b.featured && on ? ' · In homepage banner' : ''}
                  {needs ? <span style={{ color: '#e2b86a' }}> · {needs}</span> : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={`pill${b.amazonUrl ? '' : ' off'}`}>Amazon</span>
                {b.audibleUrl && <span className="pill">Audible</span>}
              </div>
              <form action={toggleBookStatus} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" role="switch" className="switch" aria-checked={on} aria-label={`Available on site: ${b.title}`}><span /></button>
                <span style={{ fontSize: 14, color: on ? 'var(--cream)' : '#e2b86a' }}>{on ? 'Available' : 'Coming soon'}</span>
              </form>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                <a href={`/books/${b.slug}`} target="_blank" className="ad-sm icon" aria-label={`View ${b.title} on the site`} title="View on site"><Ic k="ext" s={16} /></a>
                <Link href={`/admin/books/${b.id}`} className="ad-sm" title="Edit book"><Ic k="edit" s={15} />Edit</Link>
                <DeleteButton action={deleteBookAction} id={b.id} itemName={b.title} title={`Delete ${b.title}`} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="ad-note">Use the arrows to change the order books appear on the homepage shelf and in the library. Flip the toggle switch to move a book between Coming soon and Available.</p>
    </>
  );
}
