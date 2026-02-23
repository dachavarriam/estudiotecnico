import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'

// ============================================================
// MIDDLEWARE: Dual-mode Auth
// When MOCK_AUTH=true: uses cookie-based session check
// When MOCK_AUTH is not set: uses NextAuth (via auth.ts export)
//
// NOTE: For real NextAuth mode, this middleware file is replaced
// by the auth() middleware wrapper at build time. The NextAuth
// config in auth.ts exports a default middleware. However, since
// we need to support both modes, we use the cookie approach 
// universally in the middleware (both mock and real NextAuth set
// cookies/sessions that this can inspect).
//
// The actual auth validation (Slack OAuth) happens in auth.ts 
// callbacks, not in the middleware.
// ============================================================

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check for session - works with both mock cookies and NextAuth session
    // NextAuth stores session info in a cookie named 'authjs.session-token' or '__Secure-authjs.session-token'
    const mockUserId = req.cookies.get('session_userid')?.value;
    const mockRole = req.cookies.get('session_role')?.value;
    
    // NextAuth session cookie (unsigned, just check presence)
    const nextAuthSession = req.cookies.get('authjs.session-token')?.value 
        || req.cookies.get('__Secure-authjs.session-token')?.value;
    
    const isLoggedIn = !!mockUserId || !!nextAuthSession;

    // 1. Protect routes: if not logged in, redirect to home
    if (!isLoggedIn && (pathname.startsWith('/dashboard') || pathname.startsWith('/engineer') || pathname.startsWith('/director'))) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // 2. Role-based redirection (only works reliably with mock auth cookies)
    // For real NextAuth, the role is embedded in the JWT token, not directly accessible here.
    // But we still check the mock cookie for dev compatibility.
    if (mockRole) {
        if (mockRole === 'engineer' && pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/engineer/dashboard', req.url));
        }
        
        if (mockRole === 'director' && pathname.startsWith('/engineer') && !pathname.includes('/study/')) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
