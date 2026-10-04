import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Signed-in-only pages. This only checks that a session cookie exists (fast, no database call);
 * every API route still verifies the session for real.
 */
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL('/login', request.url);
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/home', '/writing/:path*', '/write/:path*', '/attempts', '/vocab', '/guidebooks/:path*'],
};
