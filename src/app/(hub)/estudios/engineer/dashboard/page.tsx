import { getEngineerStudies } from '@/actions/study-actions';
import { getSession as getUserSession } from '@/actions/user-actions';
import { EngineerDashboardView } from '@/components/engineer-dashboard-view';
import { redirect } from 'next/navigation';

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function EngineerDashboardPage() {
  const session = await getUserSession();

  if (!session || session.role !== 'engineer') {
      // If not logged in or not engineer, go home
      redirect('/');
  }

  const engineerId = session.userId;
  const engineerName = session.name || 'Ingeniero';

  const result = await getEngineerStudies(engineerId);
  const studies = result.success ? (result.data || []) : [];

  return (
    <>
        <EngineerDashboardView studies={studies} engineerName={engineerName} />
    </>
  );
}
