import Link from 'next/link';
import { Ic } from '@/components/admin/AdIcons';
import { getBooks, getReaders } from '@/lib/store';
import { deleteReaderAction } from '../../actions';

const COLS = 'minmax(0,1.1fr) minmax(0,1.3fr) 120px 150px 60px';
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default async function ReadersAdmin({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const f = (await searchParams).f || 'all';
  const [all, books] = await Promise.all([getReaders(), getBooks()]);
  const rows = all.filter((r) => f === 'all' || (f === 'ebook' ? r.format === 'Ebook' : r.format === 'Paperback'));
  const week = Date.now() - 7 * 86_400_000;
  const next = books.find((b) => b.status === 'coming');
  const bcc = rows.map((r) => r.email).join(',');
  return (
    <>
      <div className="ad-top">
        <div><h1>Advance readers</h1><p>Everyone who signed up for early copies. Each new signup is also emailed to you.</p></div>
        <div className="ad-actions">
          <a href="/admin/readers.csv" className="ad-btn"><Ic k="down" s={16} sw={1.8} />EXPORT CSV</a>
          {rows.length > 0 && <a href={`mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(next ? `Your advance copy of ${next.title}` : 'A note for my advance readers')}`} className="ad-btn pri"><Ic k="mail" s={16} sw={1.8} />EMAIL THESE READERS</a>}
        </div>
      </div>
      <div className="ad-stats">
        <div className="ad-stat"><span>TOTAL READERS</span><b>{all.length}</b></div>
        <div className="ad-stat"><span>NEW THIS WEEK</span><b>{all.filter((r) => new Date(r.createdAt).getTime() > week).length}</b></div>
        <div className="ad-stat"><span>EBOOK / PAPERBACK</span><b>{all.filter((r) => r.format === 'Ebook').length} / {all.filter((r) => r.format === 'Paperback').length}</b></div>
        <div className="ad-stat"><span>NEXT BOOK</span><b style={{ fontSize: 26, lineHeight: 1.5 }}>{next?.title || 'None set'}</b></div>
      </div>
      <nav className="ad-tabs" aria-label="Filter readers">
        <Link href="/admin/readers" className={f === 'all' ? 'on' : ''}>All readers</Link>
        <Link href="/admin/readers?f=ebook" className={f === 'ebook' ? 'on' : ''}>Ebook</Link>
        <Link href="/admin/readers?f=paper" className={f === 'paper' ? 'on' : ''}>Paperback</Link>
      </nav>
      <div className="ad-table">
        <div className="ad-tr head" style={{ gridTemplateColumns: COLS }}><span>NAME</span><span>EMAIL</span><span>FORMAT</span><span>SIGNED UP</span><span /></div>
        {rows.length === 0 && <div style={{ padding: 28, color: 'var(--muted)' }}>No signups yet. They appear here the moment someone joins from the homepage.</div>}
        {rows.map((r) => (
          <div key={r.id} className="ad-tr row" style={{ gridTemplateColumns: COLS, height: 68, fontSize: 15 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{r.name}{new Date(r.createdAt).getTime() > week && <span className="pill gold" style={{ height: 20, fontSize: 11 }}>New</span>}</span>
            <a href={`mailto:${r.email}`} style={{ color: 'var(--soft)' }}>{r.email}</a>
            <span style={{ color: 'var(--soft)' }}>{r.format}</span>
            <span style={{ color: 'var(--muted)' }}>{fmtDate(r.createdAt)}</span>
            <form action={deleteReaderAction} style={{ display: 'flex', justifyContent: 'flex-end' }}><input type="hidden" name="id" value={r.id} /><button type="submit" className="ad-sm icon" aria-label={`Remove ${r.name}`}><Ic k="trash" s={16} /></button></form>
          </div>
        ))}
      </div>
    </>
  );
}
