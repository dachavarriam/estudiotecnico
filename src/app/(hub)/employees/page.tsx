import { getAllUsers } from '@/actions/user-actions';
import { EmployeeDirectoryView } from '@/components/employee-directory-view';

import { getSession } from '@/actions/user-actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const session = await getSession();
    
    // Authorization check: Only managers can view this page
    if (!session) redirect('/login');
    const userRole = session.role?.toLowerCase() || 'user';
    const isManager = ['admin', 'superadmin', 'director'].includes(userRole);
    if (!isManager) {
        redirect('/dashboard');
    }

    const result = await getAllUsers();
    const employees = result.success ? (result.data || []) : [];

    return <EmployeeDirectoryView initialEmployees={employees} />;
}
