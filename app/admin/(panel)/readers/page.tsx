import { getBooks, getReaders } from '@/lib/store';
import ReadersClient from '@/components/admin/ReadersClient';

export default async function ReadersAdmin({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const f = (await searchParams).f || 'all';
  const [all, books] = await Promise.all([
    getReaders(),
    getBooks()
  ]);

  const rows = all.filter((r) => {
    if (f === 'all') return true;
    const fmt = (r.format || '').toLowerCase();
    if (f === 'ebook') return fmt.includes('ebook');
    if (f === 'paper') return fmt.includes('paper');
    return true;
  });
  const week = Date.now() - 7 * 86_400_000;
  const next = books.find((b) => b.status === 'coming');

  const comingBooks = books.filter(b => b.status === 'coming').map(b => ({
    id: b.id,
    title: b.title,
    status: b.status,
    hasSample: !!b.sample?.trim(),
    amazonUrl: b.amazonUrl || ''
  }));
  const allBooksList = books.map(b => ({
    id: b.id,
    title: b.title,
    status: b.status,
    hasSample: !!b.sample?.trim(),
    amazonUrl: b.amazonUrl || ''
  }));

  return (
    <ReadersClient
      readers={rows}
      allReaders={all}
      nextBook={next?.title ?? null}
      comingBooks={comingBooks}
      books={allBooksList}
      filter={f}
      totalAll={all.length}
      totalEbook={all.filter((r) => r.format?.toLowerCase().includes('ebook')).length}
      totalPaper={all.filter((r) => r.format?.toLowerCase().includes('paper')).length}
      totalNewThisWeek={all.filter((r) => new Date(r.createdAt).getTime() > week).length}
    />
  );
}
