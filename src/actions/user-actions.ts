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
        // Also support lookup by internal ID (if Slack ID missing)
        const user = list.find((u: any) => 
            u['Slack ID'] === slackId || 
            u.slack_id === slackId || 
            String(u.Id) === String(slackId) // Match by ID string execution
        );

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


// Simple Cookie-based Session (Restored for Dev Branch)
import { cookies } from 'next/headers';

export async function login(userId: string, role: string, name: string) {
    const cookieStore = await cookies();
    // Set cookies for 7 days
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    cookieStore.set('session_userid', userId, { expires });
    cookieStore.set('session_role', role, { expires });
    cookieStore.set('session_username', name, { expires });
    
    return { success: true };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_userid');
    cookieStore.delete('session_role');
    cookieStore.delete('session_username');
    return { success: true };
}

export async function getSession() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_userid')?.value;
    const role = cookieStore.get('session_role')?.value;
    const name = cookieStore.get('session_username')?.value;
    
    if (!userId) return null;
    return { userId, role, name };
}
