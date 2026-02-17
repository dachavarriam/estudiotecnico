import { getStudy } from '@/actions/study-actions';
import { StudyView } from '@/components/study-view';
import { cookies } from 'next/headers';

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const mockRole = cookieStore.get('mock_role')?.value || 'director';
  
  // Fetch Data on Server
  const result = await getStudy(id);
  const studyData = result.success ? result.data : {};

  // If we want to strictly enforce RBAC on server side (e.g. return 403), we can do it here.
  // For now, we pass the role to the client view for UI adaptation.

  return (
    <>
        <StudyView id={id} initialData={studyData} userRole={mockRole} />
    </>
  );
}
