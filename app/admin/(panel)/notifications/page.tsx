import type { Metadata } from 'next';
import { getCrmNotifications } from '@/lib/store';
import NotificationsClient from '@/components/admin/NotificationsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'CRM Notifications · Site Admin',
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { notifications, unreadCount } = await getCrmNotifications(200);

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
