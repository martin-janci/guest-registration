import { describe, it, expect } from 'vitest';
import { locales, defaultLocale, isLocale } from '@/lib/i18n/locales';

describe('locales config', () => {
  it('supports sk/en/cs', () => {
    expect(new Set(locales)).toEqual(new Set(['sk', 'en', 'cs']));
  });

  it('default locale is sk', () => {
    expect(defaultLocale).toBe('sk');
  });

  it('isLocale type guard', () => {
    expect(isLocale('sk')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
