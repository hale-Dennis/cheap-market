import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';
import { homeForRole, roleForPath } from '@/lib/roles';

/** Where unauthenticated visitors are sent for each protected area. */
const SIGN_IN_PAGE = { ADMIN: '/login', BUYER: '/signup' } as const;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const session = await verifyAccessToken(token);
  const { pathname, search } = request.nextUrl;
  const requiredRole = roleForPath(pathname);

  // /login and /signup: signed-in users go straight to their home page.
  if (requiredRole === null) {
    return session
      ? NextResponse.redirect(new URL(homeForRole(session.role), request.url))
      : NextResponse.next();
  }

  if (session?.role === requiredRole) {
    return NextResponse.next();
  }

  // Signed in with a different role: send them to their own area rather than a sign-in page.
  if (session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  const signInUrl = new URL(
    SIGN_IN_PAGE[requiredRole as keyof typeof SIGN_IN_PAGE] ?? '/login',
    request.url,
  );
  signInUrl.searchParams.set('next', pathname + search);
  const response = NextResponse.redirect(signInUrl);
  if (token) {
    // Drop expired or tampered tokens so they are not re-sent on every request.
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/buyer/:path*', '/login', '/signup'],
};
