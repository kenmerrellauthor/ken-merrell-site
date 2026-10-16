import type { Metadata } from 'next';
import { getAdSettings, getBooks } from '@/lib/store';
import AdsManagerClient from '@/components/admin/AdsManagerClient';

export const metadata: Metadata = {
  title: 'Sidebar & Display Ads · Ken Merrell Admin',
  robots: { index: false, follow: false },
};

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminAdsPage() {
  const [adSettings, books] = await Promise.all([
    getAdSettings(),
    getBooks(),
  ]);

  return (
    <AdsManagerClient
      initialSettings={adSettings}
      books={books}
    />
  );
}
