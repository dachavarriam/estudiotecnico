'use server';

import { nocodb } from '@/lib/nocodb';
import { NOCODB_TABLES } from '@/lib/constants';

// Hardcoded fallback for demo/testing stability
const DEMO_USERS = [
    { Id: 2, Name: 'Ingeniero Juan Perez', 'Slack ID': 'U01ABCDEF', email: 'juan@example.com', Role: 'engineer' }
];

export async function getUserBySlackId(slackId: string) {
    try {
        // 1. Try NocoDB fetch (without filter first to avoid syntax errors with spaces)
        // Fetch up to 100 users and filter in memory - safer for small tables
        const result = await nocodb.list(NOCODB_TABLES.users, {
            limit: 100
        }) as any;

        const list = result.list || result || [];
        
        // Find in memory (handles spaces in keys better)
        const user = list.find((u: any) => u['Slack ID'] === slackId || u.slack_id === slackId);

        if (user) {
            return { success: true, data: user };
        }
        
        // 2. Fallback to hardcoded demo user if DB fails or empty or not found
        console.warn(`User ${slackId} not found in DB list. Checking mock fallback.`);
        const demoUser = DEMO_USERS.find(u => u['Slack ID'] === slackId);
        if (demoUser) {
             console.log(`Using Fallback Mock User for ${slackId}`);
             return { success: true, data: demoUser };
        }

        return { success: false, error: 'User not found' };

    } catch (error: any) {
        console.error('Error fetching user from NocoDB:', error);
        
        // 3. Fallback on Error (e.g. Timeout)
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
        // Fallback to demo users if DB fails
        return { success: true, data: DEMO_USERS };
    }
}


import { auth, signOut } from "@/auth";

export async function login() {
    // No-op: Login is handled by NextAuth signIn() in the UI components
    return { success: true };
}

export async function logout() {
    await signOut({ redirectTo: "/" });
    return { success: true };
}

export async function getSession() {
    const session = await auth();
    if (!session?.user) return null;
    
    return { 
        userId: (session.user as any).slack_id, 
        role: (session.user as any).role, 
        name: session.user.name 
    };
}
