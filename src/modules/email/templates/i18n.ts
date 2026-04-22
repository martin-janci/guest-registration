import enMessages from '../../../../messages/en.json';
import skMessages from '../../../../messages/sk.json';
import csMessages from '../../../../messages/cs.json';
import { defaultLocale, type Locale } from '@/lib/i18n/locales';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogs: Record<Locale, any> = {
  en: enMessages,
  sk: skMessages,
  cs: csMessages,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function emailDict(locale: Locale | undefined): any {
  const key = locale ?? defaultLocale;
  return (catalogs[key] ?? catalogs[defaultLocale]).email;
}

export function render(
  tpl: string,
  vars: Record<string, string | number>,
): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export function pickLocale(hint: string | undefined | null): Locale {
  if (!hint) return defaultLocale;
  const first = hint.slice(0, 2).toLowerCase();
  if (first === 'sk' || first === 'en' || first === 'cs') return first as Locale;
  return defaultLocale;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n  ');
}
