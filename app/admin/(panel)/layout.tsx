import { Suspense } from 'react';
import type { Metadata } from 'next';
import '../admin.css';
import Sidebar from '@/components/admin/Sidebar';
import { requireAdmin } from '@/lib/auth';
import { getCrmNotifications, getReaders, getSite } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Site admin', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const week = Date.now() - 7 * 86_400_000;
  const site = await getSite();
  const lastSeen = site.lastSeenReaders ? new Date(site.lastSeenReaders).getTime() : 0;
  const cutoff = Math.max(week, lastSeen);
  const [readers, { notifications, unreadCount }] = await Promise.all([
    getReaders(),
    getCrmNotifications()
  ]);
  const fresh = readers.filter((r) => new Date(r.createdAt).getTime() > cutoff).length;
  return (
    <div className="ad-shell">
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0908' }} />}>
        <Sidebar badge={fresh} email={email} notifications={notifications} unreadCount={unreadCount}>
          {children}
        </Sidebar>
      </Suspense>
    </div>
  );
}
