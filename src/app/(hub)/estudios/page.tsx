import { getAllStudies } from '@/actions/study-actions';
import { DashboardView } from '@/components/dashboard-view';

// Force dynamic rendering since we fetch data on every request
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const result = await getAllStudies();
  const studies = result.success ? (result.data || []) : [];

  return <DashboardView initialStudies={studies} />;
}
