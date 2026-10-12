import { getBooks } from '@/lib/store';
import { getAnalyticsDashboardData } from '@/lib/analytics';
import AnalyticsClient from '@/components/admin/AnalyticsClient';

export const metadata = {
  title: 'Ad Tracking & Analytics · Ken Merrell Admin',
};

export const revalidate = 0;

export default async function AnalyticsPage() {
  const [books, analytics] = await Promise.all([getBooks(), getAnalyticsDashboardData()]);

  return (
    <AnalyticsClient
      initialKpis={analytics.kpis}
      dailyTraffic={analytics.dailyTraffic}
      campaigns={analytics.campaigns}
      topPages={analytics.topPages}
      initialSessions={analytics.sessions}
      initialEvents={analytics.events}
      books={books}
    />
  );
}
