import { getAnalyticsDashboardData } from '@/lib/analytics';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics · Ken Merrell Admin',
};

export const revalidate = 0;

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsDashboardData();

  return (
    <AnalyticsDashboard
      initialKpis={analytics.kpis}
      dailyTraffic={analytics.dailyTraffic}
      sessions={analytics.sessions}
      events={analytics.events}
    />
  );
}
