import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'

// ============================================================
// MIDDLEWARE: Core NextAuth protection
// Protects internal dashboard routes from unauthorized access
// ============================================================

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // NextAuth session cookie (unsigned, just check presence)
    // Works across both standard and __Secure prefixes
    const nextAuthSession = req.cookies.get('authjs.session-token')?.value 
        || req.cookies.get('__Secure-authjs.session-token')?.value;
    
    const isLoggedIn = !!nextAuthSession;

    // 1. Protect routes: if not logged in, redirect to home
    if (!isLoggedIn && (pathname.startsWith('/dashboard') || pathname.startsWith('/estudios') || pathname.startsWith('/employees') || pathname.startsWith('/calendar'))) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // Role-based redirection logic for NextAuth would require decoding the JWT.
    // Since NextAuth JWTs are encrypted (JWE) by default unless customized, we let Next.js layout/pages
    // read the session securely server-side and trigger redirects individually if unauthorized.

    return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
