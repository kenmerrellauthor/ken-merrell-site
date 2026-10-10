import { getBooks } from '@/lib/store';
import {
  getAnalyticsKPIs,
  getDailyTraffic,
  getCampaignLeaderboard,
  getTopPages,
  getAllSessions,
  getAllEvents,
} from '@/lib/analytics';
import AnalyticsClient from '@/components/admin/AnalyticsClient';

export const metadata = {
  title: 'Ad Tracking & Analytics · Ken Merrell Admin',
};

export const revalidate = 0;

export default async function AnalyticsPage() {
  const [books, kpis, dailyTraffic, campaigns, topPages, sessions, events] = await Promise.all([
    getBooks(),
    getAnalyticsKPIs(),
    getDailyTraffic(),
    getCampaignLeaderboard(),
    getTopPages(),
    getAllSessions(),
    getAllEvents(),
  ]);

  return (
    <AnalyticsClient
      initialKpis={kpis}
      dailyTraffic={dailyTraffic}
      campaigns={campaigns}
      topPages={topPages}
      initialSessions={sessions}
      initialEvents={events}
      books={books}
    />
  );
}
