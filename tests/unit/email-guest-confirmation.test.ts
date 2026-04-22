import { describe, it, expect } from 'vitest';
import { guestConfirmationTemplate } from '@/modules/email/templates/guest-confirmation';
import { pickLocale } from '@/modules/email/templates/i18n';

describe('guestConfirmationTemplate i18n', () => {
  it('renders English subject and body', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Anna',
      tripTitle: 'May Stay',
      propertyName: 'Tatranská Perla',
      locale: 'en',
    });
    expect(t.subject).toBe('Registration received — Tatranská Perla');
    expect(t.text).toContain('Hi Anna,');
    expect(t.text).toContain('May Stay');
    expect(t.text).toContain('Tatranská Perla');
    expect(t.html).toContain('Hi Anna,');
  });

  it('renders Slovak subject and body', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Ján',
      tripTitle: 'Letný pobyt',
      propertyName: 'Donovaly',
      locale: 'sk',
    });
    expect(t.subject).toContain('Registrácia prijatá');
    expect(t.text).toContain('Ján');
    expect(t.text).toContain('Donovaly');
    expect(t.text).toContain('hostiteľ');
  });

  it('renders Czech when locale is cs', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Pavel',
      tripTitle: 'Letní pobyt',
      propertyName: 'Praha',
      locale: 'cs',
    });
    expect(t.subject).toContain('Registrace přijata');
    expect(t.text).toContain('hostitel');
  });

  it('falls back to default locale (sk) when locale is undefined', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Anna',
      tripTitle: 'trip',
      propertyName: 'place',
    });
    expect(t.subject).toContain('Registrácia prijatá');
  });
});

describe('pickLocale', () => {
  it('returns sk for Slovak Accept-Language headers', () => {
    expect(pickLocale('sk-SK,sk;q=0.9')).toBe('sk');
    expect(pickLocale('SK')).toBe('sk');
  });

  it('returns en for English Accept-Language headers', () => {
    expect(pickLocale('en-US,en;q=0.9')).toBe('en');
    expect(pickLocale('en')).toBe('en');
  });

  it('returns cs for Czech Accept-Language headers', () => {
    expect(pickLocale('cs-CZ,cs;q=0.9')).toBe('cs');
  });

  it('returns defaultLocale for unknown or missing hints', () => {
    expect(pickLocale('fr-FR')).toBe('sk');
    expect(pickLocale(null)).toBe('sk');
    expect(pickLocale(undefined)).toBe('sk');
    expect(pickLocale('')).toBe('sk');
  });
});
