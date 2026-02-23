'use server';

import { nocodb } from '@/lib/nocodb';
import { NOCODB_TABLES } from '@/lib/constants';

const IS_MOCK_AUTH = process.env.MOCK_AUTH === 'true';

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
// AUTH: Dual-mode (NextAuth Slack OR Cookie Mock)
// Controlled by MOCK_AUTH env variable
// ============================================================

import { cookies } from 'next/headers';

// --- Mock Auth (Cookie-based, for development) ---

async function mockLogin(userId: string, role: string, name: string) {
    const cookieStore = await cookies();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    cookieStore.set('session_userid', userId, { expires });
    cookieStore.set('session_role', role, { expires });
    cookieStore.set('session_username', name, { expires });
    
    return { success: true };
}

async function mockLogout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_userid');
    cookieStore.delete('session_role');
    cookieStore.delete('session_username');
    return { success: true };
}

async function mockGetSession() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_userid')?.value;
    const role = cookieStore.get('session_role')?.value;
    const name = cookieStore.get('session_username')?.value;
    
    if (!userId) return null;
    return { userId, role, name };
}

// --- Real Auth (NextAuth + Slack) ---

async function realLogout() {
    const { signOut } = await import("@/auth");
    await signOut({ redirectTo: "/" });
    return { success: true };
}

async function realGetSession() {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user) return null;
    
    return { 
        userId: (session.user as any).slack_id, 
        role: (session.user as any).role, 
        name: session.user.name 
    };
}

// --- Exports (route to the correct implementation) ---

export async function login(userId: string, role: string, name: string) {
    if (IS_MOCK_AUTH) {
        return mockLogin(userId, role, name);
    }
    // Real login is handled by NextAuth signIn() in the UI (LoginButton component)
    return { success: true };
}

export async function logout() {
    if (IS_MOCK_AUTH) {
        return mockLogout();
    }
    return realLogout();
}

export async function getSession() {
    if (IS_MOCK_AUTH) {
        return mockGetSession();
    }
    return realGetSession();
}
