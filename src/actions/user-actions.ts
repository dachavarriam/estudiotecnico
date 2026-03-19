'use server';

import { nocodb } from '@/lib/nocodb';
import { NOCODB_TABLES } from '@/lib/constants';

const IS_MOCK_AUTH = false;

// Hardcoded fallback for demo/testing stability
const DEMO_USERS = [
    { Id: 2, Name: 'Ingeniero Juan Perez', 'Slack ID': 'U01ABCDEF', email: 'juan@example.com', Role: 'engineer' }
];

export async function getUserBySlackId(slackId: string) {
    try {
        // Fetch up to 100 users and filter in memory - safer for small tables
        const result = await nocodb.list(NOCODB_TABLES.users, {
            limit: 100
        }) as any;

        const list = result.list || result || [];
        
        // Find in memory (handles spaces in keys better)
        // Also support lookup by internal ID (if Slack ID missing)
        const user = list.find((u: any) => 
            u['Slack ID'] === slackId || 
            u.slack_id === slackId || 
            String(u.Id) === String(slackId) // Match by ID string
        );

        if (user) {
            return { success: true, data: user };
        }
        
        // Fallback to hardcoded demo user if not found
        console.warn(`User ${slackId} not found in DB list. Checking mock fallback.`);
        const demoUser = DEMO_USERS.find(u => u['Slack ID'] === slackId);
        if (demoUser) {
             console.log(`Using Fallback Mock User for ${slackId}`);
             return { success: true, data: demoUser };
        }

        return { success: false, error: 'User not found' };

    } catch (error: any) {
        console.error('Error fetching user from NocoDB:', error);
        
        const demoUser = DEMO_USERS.find(u => u['Slack ID'] === slackId);
        if (demoUser) {
             console.log(`Using Fallback Mock User for ${slackId} (after error)`);
             return { success: true, data: demoUser };
        }
        return { success: false, error: error.message };
    }
}

export async function getAllUsers() {
    try {
        const result = await nocodb.list(NOCODB_TABLES.users, {
            sort: 'Name',
            limit: 100
        }) as any;
        const list = result.list || result || [];
        return { success: true, data: list };
    } catch (e: any) {
        console.error("Error fetching users:", e);
        return { success: true, data: DEMO_USERS };
    }
}


// ============================================================
// Real Auth (NextAuth Credentials)
// ============================================================

export async function login(userId: string, role: string, name: string) {
    // Only used conceptually now - handled strictly by NextAuth client flow
    return { success: true };
}

export async function logout() {
    const { signOut } = await import("@/auth");
    await signOut({ redirectTo: "/" });
    return { success: true };
}

export async function getSession() {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user) return null;
    
    return { 
        userId: (session.user as any).id, 
        role: ((session.user as any).role || "").toLowerCase(), 
        name: session.user.name 
    };
}
