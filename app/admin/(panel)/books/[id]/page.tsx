import { redirect } from 'next/navigation';
import BookForm from '@/components/admin/BookForm';
import { getBook, getVideos, sanitizeBook } from '@/lib/store';
import type { Book } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const blankBook: Book = sanitizeBook({
  id: '',
  slug: '',
  title: '',
  displayTitle: '',
  tagline: '',
  description: '',
  genre: 'Historical Fiction · A novel',
  status: 'available',
  featured: false,
  isNew: true,
  order: 1,
  cover: null,
  banner: null,
  clothColor: '#1c1712',
  amazonUrl: '',
  audibleUrl: '',
  videoUrl: '',
  videoThumbnail: null,
  published: '',
  pages: '',
  formats: 'Print, Ebook',
  isbn: '',
  quotes: [],
  reviews: [],
  chapterTitle: '',
  sample: '',
  releaseDate: '',
  releaseLabel: '',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
});

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isCreating = id === 'new';
  const [book, videos] = await Promise.all([
    isCreating ? Promise.resolve(blankBook) : getBook(id),
    getVideos()
  ]);

  if (!book && !isCreating) {
    redirect('/admin');
  }

  return <BookForm book={book || blankBook} isNew={isCreating} videos={videos} />;
}
