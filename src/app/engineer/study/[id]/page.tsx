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
  // We fetch detailed study data
  const result = await getStudy(id);
  const studyData = result.success ? result.data : {};

  // Fetch List for Navigation (Simple optimized fetch could be added later)
  const { getAllStudies } = await import('@/actions/study-actions');
  const allRes = await getAllStudies();
  const allStudies = allRes.success ? allRes.data : [];
  
  // Find current index
  // Ensure ID comparison is safe (string vs number)
  const currentIndex = allStudies.findIndex((s: any) => String(s.id) === String(id));
  
  let prevId, nextId;
  if (currentIndex >= 0) {
      // List is sorted Newest First (Index 0 is newest)
      // "Previous" (Left Arrow) -> Newer Study (Index - 1)
      if (currentIndex > 0) prevId = allStudies[currentIndex - 1].id;
      // "Next" (Right Arrow) -> Older Study (Index + 1)
      if (currentIndex < allStudies.length - 1) nextId = allStudies[currentIndex + 1].id;
  }

  // Get Session
  const { getSession } = await import('@/actions/user-actions');
  const session = await getSession();
  
  const currentUser = session ? {
      id: session.userId,
      name: session.name || 'Usuario',
      role: session.role || mockRole
  } : {
      id: 'mock-user-id', 
      name: mockRole === 'director' ? 'Director Demo' : 'Irvin Jimenez',
      role: mockRole
  };

  return (
    <>
        <StudyView 
            id={id} 
            initialData={studyData} 
            userRole={currentUser.role} 
            prevId={String(prevId)} 
            nextId={String(nextId)} 
            currentUser={currentUser}
        />
    </>
  );
}
