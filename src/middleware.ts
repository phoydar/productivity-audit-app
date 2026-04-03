import { auth } from '@/lib/auth-config';
import { NextResponse } from 'next/server';

/**
 * Middleware that protects all routes except:
 * - /sign-in (the login page)
 * - /api/auth/* (NextAuth endpoints)
 * - /api/* with x-api-secret header (Cowork plugin access)
 * - Static assets (_next, favicon, etc.)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow NextAuth endpoints through (sign-in/callback/etc.)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow API requests with valid x-api-secret (Cowork plugin)
  if (pathname.startsWith('/api/')) {
    const secret = req.headers.get('x-api-secret');
    if (secret && secret === process.env.API_SECRET) {
      return NextResponse.next();
    }
  }

  // If not authenticated, redirect pages to sign-in, return 401 for API
  if (!req.auth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - sign-in page (must be accessible without auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sign-in).*)',
  ],
};
