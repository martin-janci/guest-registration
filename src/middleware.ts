import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n/locales';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',   // sk (default) has no prefix; en/cs do
  localeDetection: true,
  localeCookie: { name: 'NEXT_LOCALE' },
});

export const config = {
  // Skip Next internals, static files, api, worker
  matcher: ['/((?!_next|_vercel|api|sw\\.js|workbox-|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|webmanifest|txt)$).*)'],
};
