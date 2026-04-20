import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

export function middleware(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');
  const isHousekeeper = req.nextUrl.pathname.startsWith('/housekeeper');
  if (!isAdmin && !isHousekeeper) return NextResponse.next();

  const sessionId = req.cookies.get(env.SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/housekeeper/:path*'],
};
