import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Mock Middleware for Dev Branch
export async function middleware(req: NextRequest) {
    // Simple check for cookie
    const cookieStore = await cookies();
    const role = cookieStore.get('session_role')?.value;
    const { pathname } = req.nextUrl;

    // Strict Role Redirection (Same logic as before but with cookies)
    if (role === 'engineer' && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/engineer/dashboard', req.url));
    }
    
    if (role === 'director' && pathname.startsWith('/engineer') && !pathname.includes('/study/')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
