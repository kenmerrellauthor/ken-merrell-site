import SiteForm from '@/components/admin/SiteForm';
import { getSite } from '@/lib/store';
export default async function AboutAdmin() {
  return <SiteForm site={await getSite()} />;
}
