import { getAllStudies } from '@/actions/study-actions';
import { DashboardView } from '@/components/dashboard-view';
import { getSession } from '@/actions/user-actions';
import { redirect } from 'next/navigation';

// Force dynamic rendering since we fetch data on every request
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Si NO es admin o superadmin o director, asume que es un usuario normal (ingeniero/analista)
  if (!['admin', 'superadmin', 'director'].includes(session.role)) {
    redirect('/estudios/engineer/dashboard');
  }

  const result = await getAllStudies();
  const studies = result.success ? (result.data || []) : [];

  return <DashboardView initialStudies={studies} />;
}
