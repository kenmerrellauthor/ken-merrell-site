import { notFound } from 'next/navigation';
import BookForm from '@/components/admin/BookForm';
import { getBook, getVideos } from '@/lib/store';
import { seedBooks } from '@/lib/seed';
import type { Book } from '@/lib/types';

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, videos] = await Promise.all([
    id === 'new'
      ? Promise.resolve({
          ...seedBooks[3], id: '', slug: '', title: '', displayTitle: '', tagline: '', description: '', genre: 'A novel',
          published: '', pages: '', formats: 'Print, Ebook', isbn: '', chapterTitle: '', sample: '', clothColor: '#1c1712', order: 0
        } as Book)
      : getBook(id),
    getVideos()
  ]);
  if (!book) notFound();
  return <BookForm book={book} isNew={id === 'new'} videos={videos} />;
}
