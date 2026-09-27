import { Suspense } from 'react';
import type { Metadata } from 'next';
import '../admin.css';
import Sidebar from '@/components/admin/Sidebar';
import { requireAdmin } from '@/lib/auth';
import { getReaders } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Site admin', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const week = Date.now() - 7 * 86_400_000;
  const fresh = (await getReaders()).filter((r) => new Date(r.createdAt).getTime() > week).length;
  return (
    <div className="ad">
      <Suspense fallback={<aside className="ad-side" />}>
        <Sidebar badge={fresh} email={email} />
      </Suspense>
      <main className="ad-main">{children}</main>
    </div>
  );
}
