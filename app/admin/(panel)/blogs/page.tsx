import Link from 'next/link';
import { Ic } from '@/components/admin/AdIcons';
import { getBlogs, getBooks } from '@/lib/store';
import BlogListClient from '@/components/admin/BlogListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBlogsPage() {
  const [blogs, books] = await Promise.all([getBlogs(), getBooks()]);
  const published = blogs.filter((b) => b.isPublished);
  const drafts = blogs.filter((b) => !b.isPublished);
  const totalViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);
  const geoFaqsCount = blogs.reduce((acc, b) => acc + (b.faqItems?.length || 0), 0);

  return (
    <>
      <div className="crm-top">
        <div>
          <h1>Blog & Articles</h1>
          <p>
            Publish articles, historical research, and behind-the-scenes writing craft.
            All posts are optimized for Google SEO and Generative AI Search (ChatGPT, Perplexity, Gemini).
          </p>
        </div>
        <div className="crm-actions">
          <Link href="/blog" target="_blank" className="crm-btn sec">
            <Ic k="link" s={15} />VIEW PUBLIC BLOG
          </Link>
          <Link href="/admin/blogs/new" className="crm-btn pri">
            <Ic k="plus" s={16} sw={1.8} />NEW ARTICLE
          </Link>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat"><span>PUBLISHED POSTS</span><b>{published.length}</b></div>
        <div className="crm-stat"><span>DRAFTS</span><b>{drafts.length}</b></div>
        <div className="crm-stat"><span>TOTAL VIEWS</span><b>{totalViews.toLocaleString()}</b></div>
        <div className="crm-stat"><span>GEO FAQ ENTRIES</span><b>{geoFaqsCount}</b></div>
      </div>

      <BlogListClient initialBlogs={blogs} books={books} />
    </>
  );
}
