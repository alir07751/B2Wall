import { LandingClient } from '@/components/landing/LandingClient';
import { fetchAllOpportunities } from '@/lib/landing-api';
import { MOCK_OPPORTUNITIES } from '@/lib/landing-mock';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function LandingPage() {
  const fromApi = await fetchAllOpportunities();
  const opportunities = fromApi.length > 0 ? fromApi : MOCK_OPPORTUNITIES;
  return <LandingClient opportunities={opportunities} />;
}
