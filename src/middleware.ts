import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n/locales';
import { env } from '@/lib/env';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',   // sk (default) has no prefix; en/cs do
  localeDetection: true,
  localeCookie: { name: 'NEXT_LOCALE' },
});

// Strip an optional `/<locale>` prefix so the auth-gate check works regardless
// of the URL shape next-intl rewrites/redirects to.
function stripLocalePrefix(pathname: string): string {
  for (const loc of locales) {
    if (pathname === `/${loc}`) return '/';
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
}

export default function middleware(req: NextRequest): Response {
  const bare = stripLocalePrefix(req.nextUrl.pathname);
  const needsAuth = bare.startsWith('/admin') || bare.startsWith('/housekeeper');

  if (needsAuth) {
    const sessionId = req.cookies.get(env.SESSION_COOKIE_NAME)?.value;
    if (!sessionId) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Skip Next internals, static files, api, service worker
  matcher: ['/((?!_next|_vercel|api|sw\\.js|workbox-|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|webmanifest|txt)$).*)'],
};
