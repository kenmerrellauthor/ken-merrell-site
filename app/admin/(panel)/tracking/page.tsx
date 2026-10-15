import { getBooks } from '@/lib/store';
import { getAnalyticsDashboardData } from '@/lib/analytics';
import AdTrackingClient from '@/components/admin/analytics/AdTrackingClient';

export const metadata = {
  title: 'Ad Tracking · Ken Merrell Admin',
};

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function AdTrackingPage() {
  const [books, analytics] = await Promise.all([getBooks(), getAnalyticsDashboardData()]);

  return (
    <AdTrackingClient
      dailyTraffic={analytics.dailyTraffic}
      campaigns={analytics.campaigns}
      initialSessions={analytics.sessions}
      initialEvents={analytics.events}
      books={books}
    />
  );
}
