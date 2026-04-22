export const locales = ['sk', 'en', 'cs'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'sk';

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}
