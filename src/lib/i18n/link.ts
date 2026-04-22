import { createNavigation } from 'next-intl/navigation';
import { getLocale } from 'next-intl/server';
import type { RedirectType } from 'next/navigation';
import { locales, defaultLocale } from './locales';

const nav = createNavigation({ locales, defaultLocale, localePrefix: 'as-needed' });

export const { Link, usePathname, useRouter, getPathname } = nav;

/**
 * Locale-aware redirect. Reads the current locale via next-intl/server and
 * prefixes the href automatically (respecting localePrefix: 'as-needed').
 */
export async function redirect(href: string, type?: RedirectType): Promise<never> {
  const locale = await getLocale();
  return nav.redirect({ href, locale }, type);
}
