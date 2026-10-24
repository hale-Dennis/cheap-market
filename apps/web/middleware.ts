import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const session = await verifyAccessToken(token);
  const isAdmin = session?.role === 'ADMIN';
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (isAdmin) {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname + search);
    const response = NextResponse.redirect(loginUrl);
    if (token && !session) {
      // Drop expired or tampered tokens so they are not re-sent on every request.
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
    }
    return response;
  }

  // On /login: admins who are already signed in go straight to the dashboard.
  if (isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
