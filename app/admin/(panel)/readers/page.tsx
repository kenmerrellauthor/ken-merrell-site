import { getBooks, getReaders } from '@/lib/store';
import ReadersClient from '@/components/admin/ReadersClient';

export default async function ReadersAdmin({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const f = (await searchParams).f || 'all';
  const [all, books] = await Promise.all([getReaders(), getBooks()]);

  const rows = all.filter((r) =>
    f === 'all' || (f === 'ebook' ? r.format === 'Ebook' : r.format === 'Paperback')
  );
  const week = Date.now() - 7 * 86_400_000;
  const next = books.find((b) => b.status === 'coming');

  const comingBooks = books.filter(b => b.status === 'coming').map(b => ({ id: b.id, title: b.title, status: b.status, hasSample: !!b.sample?.trim() }));
  const allBooksList = books.map(b => ({ id: b.id, title: b.title, status: b.status, hasSample: !!b.sample?.trim() }));

  return (
    <ReadersClient
      readers={rows}
      allReaders={all}
      nextBook={next?.title ?? null}
      comingBooks={comingBooks}
      books={allBooksList}
      filter={f}
      totalAll={all.length}
      totalEbook={all.filter((r) => r.format === 'Ebook').length}
      totalPaper={all.filter((r) => r.format === 'Paperback').length}
      totalNewThisWeek={all.filter((r) => new Date(r.createdAt).getTime() > week).length}
    />
  );
}
