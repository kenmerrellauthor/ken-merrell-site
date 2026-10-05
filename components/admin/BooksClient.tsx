'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Ic } from '@/components/admin/AdIcons';
import { Cover } from '@/components/Bits';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { deleteBookAction, moveBook, toggleBookStatus } from '@/app/admin/actions';

const COLS = '44px 76px minmax(0, 1fr) 140px 170px 210px';

export default function BooksClient({ books }: { books: any[] }) {
  const [tab, setTab] = useState('all');
  const live = books.filter((b) => b.status === 'available');
  const soon = books.filter((b) => b.status === 'coming');
  const rows = tab === 'live' ? live : tab === 'soon' ? soon : books;
  const liveIndex = (id: string) => live.findIndex((b) => b.id === id) + 1;

  return (
    <>
      <nav className="crm-tabs" aria-label="Filter books">
        <button type="button" onClick={() => setTab('all')} className={tab === 'all' ? 'on' : ''} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>All books ({books.length})</button>
        <button type="button" onClick={() => setTab('live')} className={tab === 'live' ? 'on' : ''} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>Available ({live.length})</button>
        <button type="button" onClick={() => setTab('soon')} className={tab === 'soon' ? 'on' : ''} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>Coming soon ({soon.length})</button>
      </nav>

      <div className="crm-table">
        <div className="crm-tr head" style={{ gridTemplateColumns: COLS }}>
          <span>ORDER</span><span>COVER</span><span>TITLE</span><span>LINKS</span><span>STATUS</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        {rows.length === 0 && <div style={{ padding: 28, color: 'var(--muted)' }}>Nothing here yet.</div>}
        {rows.map((b) => {
          const i = books.findIndex((x) => x.id === b.id);
          const on = b.status === 'available';
          const sampleStr = typeof b.sample === 'string' ? b.sample : '';
          const needs = [!b.cover && 'Needs cover', !sampleStr.trim() && on && 'No sample', !b.amazonUrl && on && 'No Amazon link'].filter(Boolean).join(' · ');
          return (
            <div key={b.id} className="crm-tr row" style={{ gridTemplateColumns: COLS, height: 104 }}>
              <div className="movers">
                <form action={moveBook}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="dir" value="up" /><button type="submit" disabled={i === 0} aria-label={`Move ${b.title} up`}><Ic k="caretUp" s={16} /></button></form>
                <form action={moveBook}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="dir" value="down" /><button type="submit" disabled={i === books.length - 1} aria-label={`Move ${b.title} down`}><Ic k="caretDown" s={16} /></button></form>
              </div>
              <div className="crm-thumb"><Cover book={b} w={52} h={78} title={9} author={5} /><div className="km-spine abs" /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span className="crm-title">{b.title}</span>
                <span className="crm-meta">
                  {on ? `No. ${String(liveIndex(b.id)).padStart(2, '0')}` : `Expected ${b.releaseLabel || 'date not set'}`}
                  {b.featured && on ? ' · In homepage banner' : ''}
                  {b.isNew && on ? ' · NEW ribbon' : ''}
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
                <a href={`/books/${b.slug}`} target="_blank" className="crm-sm icon" aria-label={`View ${b.title} on the site`} title="View on site"><Ic k="ext" s={16} /></a>
                <Link href={`/admin/books/${b.id}`} className="crm-sm" title="Edit book"><Ic k="edit" s={15} />Edit</Link>
                <DeleteButton action={deleteBookAction} id={b.id} itemName={b.title} title={`Delete ${b.title}`} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="crm-note">Use the arrows to change the order books appear on the homepage shelf and in the library. Flip the toggle switch to move a book between Coming soon and Available.</p>
    </>
  );
}
