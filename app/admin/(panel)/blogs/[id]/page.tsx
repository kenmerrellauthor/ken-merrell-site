import { redirect } from 'next/navigation';
import BlogEditorClient from '@/components/admin/BlogEditorClient';
import { getBlog, getBooks } from '@/lib/store';
import type { BlogPost } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const blankBlog: BlogPost = {
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  coverImage: null,
  category: 'Behind the Book',
  tags: ['Ken Merrell', 'Historical Fiction'],
  readTimeMinutes: 5,
  authorName: 'Ken Merrell',
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPublished: true,
  featured: false,
  views: 0,
  relatedBookSlug: null,
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  keyTakeaways: [
    'Authentic 19th-century historical records and archival findings.',
    'Behind-the-scenes character evolution and moral conflict.',
    'Historical accuracy vs. dramatic narrative tension.'
  ],
  faqItems: [
    {
      question: 'Is this story based on real historical records?',
      answer: 'Yes, Ken Merrell conducts extensive primary-source research into frontier journals, court records, and period letters to ensure authentic realism.'
    }
  ],
};

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isCreating = id === 'new';
  const [blog, books] = await Promise.all([
    isCreating ? Promise.resolve(blankBlog) : getBlog(id),
    getBooks(),
  ]);

  if (!blog && !isCreating) {
    redirect('/admin/blogs');
  }

  return (
    <BlogEditorClient
      initialBlog={blog || blankBlog}
      isNew={isCreating}
      books={books}
    />
  );
}
