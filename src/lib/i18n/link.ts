import { createNavigation } from 'next-intl/navigation';
import { redirect as nextRedirect } from 'next/navigation';
import type { RedirectType } from 'next/navigation';
import { locales, defaultLocale } from './locales';

const nav = createNavigation({ locales, defaultLocale, localePrefix: 'as-needed' });

export const { Link, usePathname, useRouter, getPathname } = nav;

/**
 * Server-action friendly redirect. Uses Next.js's native `redirect` (which
 * throws NEXT_REDIRECT synchronously) so Server Actions terminate cleanly.
 *
 * The user's locale cookie (`NEXT_LOCALE`) travels with the response, so the
 * next-intl middleware re-applies the locale prefix on the destination
 * request — e.g. a user on `/en/login` submitting a form that calls
 * `redirect('/admin/dashboard')` is taken to `/en/admin/dashboard` via one
 * extra middleware hop. This avoids the async wrapper that previously
 * caused Server Actions to hang.
 */
export function redirect(href: string, type?: RedirectType): never {
  return nextRedirect(href, type);
}
