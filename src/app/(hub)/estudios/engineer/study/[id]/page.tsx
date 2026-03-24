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
  const { getAllStudies, getEngineerStudies, checkIsFollowing } = await import('@/actions/study-actions');
  const allRes = await getAllStudies();
  const allStudies = allRes.success ? allRes.data : [];
  
  // Find current index
  const currentIndex = allStudies.findIndex((s: any) => String(s.id) === String(id));
  
  let prevId, nextId;
  if (currentIndex >= 0) {
      if (currentIndex > 0) prevId = allStudies[currentIndex - 1].id;
      if (currentIndex < allStudies.length - 1) nextId = allStudies[currentIndex + 1].id;
  }

  // Get Session
  const { getSession } = await import('@/actions/user-actions');
  const session = await getSession();
  
  const currentUser = session ? {
      id: session.userId,
      name: session.name || 'Usuario',
      email: session.email || '',
      role: session.role || mockRole
  } : {
      id: 'mock-user-id', 
      name: mockRole === 'director' ? 'Director Demo' : 'Irvin Jimenez',
      email: '',
      role: mockRole
  };

  // Explicitly check if the current user is the assigned engineer for this study
  const myStudiesRes = await getEngineerStudies(currentUser.id, currentUser.name, currentUser.email);
  const myStudies = myStudiesRes.success ? myStudiesRes.data : [];
  const isAssignedToMe = myStudies.some((s: any) => String(s.id) === String(id));
  
  // Follower Check
  const followRes = await checkIsFollowing(id, currentUser.id);
  const isCollaborator = isAssignedToMe || !!followRes.isFollowing;

  return (
    <>
        <StudyView 
            id={id} 
            initialData={studyData} 
            userRole={currentUser.role} 
            prevId={String(prevId)} 
            nextId={String(nextId)} 
            currentUser={currentUser}
            isCollaborator={isCollaborator}
        />
    </>
  );
}
