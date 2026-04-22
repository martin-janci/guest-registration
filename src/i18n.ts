import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/locales';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!requested || !isLocale(requested)) notFound();
  return {
    locale: requested,
    messages: (await import(`../messages/${requested}.json`)).default,
  };
});
