import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminAdsPage() {
  redirect('/admin/blogs?tab=ads');
}
