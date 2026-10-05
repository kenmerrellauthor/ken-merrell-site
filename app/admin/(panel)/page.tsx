import Link from 'next/link';
import { Ic } from '@/components/admin/AdIcons';
import { getBooks, getReaders, getVideos } from '@/lib/store';
import BooksClient from '@/components/admin/BooksClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BooksAdmin() {
  const [books, videos, readers] = await Promise.all([getBooks(), getVideos(), getReaders()]);
  const live = books.filter((b) => b.status === 'available');
  const soon = books.filter((b) => b.status === 'coming');
  const week = Date.now() - 7 * 86_400_000;

  return (
    <>
      <div className="crm-top">
        <div>
          <h1>Books</h1>
          <p>Add a book, edit its page, or move it from Coming soon to Available when it launches.</p>
        </div>
        <div className="crm-actions">
          <Link href="/admin/books/new" className="crm-btn pri"><Ic k="plus" s={16} sw={1.8} />ADD A BOOK</Link>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat"><span>AVAILABLE</span><b>{live.length}</b></div>
        <div className="crm-stat"><span>COMING SOON</span><b>{soon.length}</b></div>
        <div className="crm-stat"><span>VIDEOS</span><b>{videos.filter((v) => v.youtubeId).length}</b></div>
        <div className="crm-stat"><span>NEW READER SIGNUPS</span><b>{readers.filter((r) => new Date(r.createdAt).getTime() > week).length}</b></div>
      </div>

      <BooksClient books={books} />
    </>
  );
}
