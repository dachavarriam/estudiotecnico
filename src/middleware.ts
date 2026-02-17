import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // 1. Redirect if trying to access dashboard/engineer pages without login
  if (!isLoggedIn && (path.startsWith('/dashboard') || path.startsWith('/engineer'))) {
      return NextResponse.redirect(new URL('/', nextUrl));
  }

  // 2. Redirect if logged in but trying to access wrong role page
  if (isLoggedIn) {
      const role = (req.auth?.user as any).role;
      
      // Engineer trying to access Director Dashboard
      if (role === 'engineer' && path.startsWith('/dashboard')) {
          return NextResponse.redirect(new URL('/engineer/dashboard', nextUrl));
      }

      // Director trying to access Engineer Dashboard (Optional: Directors might want to see it, but for now strict)
      // Actually Directors are admins, so maybe allow? 
      // User requested strict separation in previous tasks "Director / Engineer".
      // Let's keep it strict for clarity.
      if (role === 'director' && path.startsWith('/engineer') && !path.includes('/study/')) { 
          // Allow accessing study details if shared, but main dashboard redirects
           return NextResponse.redirect(new URL('/dashboard', nextUrl));
      }
  }

  return NextResponse.next();
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
