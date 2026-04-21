import { describe, it, expect } from 'vitest';
import {
  submitRegistrationSchema,
  submitGuestSchema,
} from '@/modules/registrations/schema';

describe('registrations schemas', () => {
  it('submitGuestSchema rejects unchecked GDPR', () => {
    const r = submitGuestSchema.safeParse({
      firstName: 'A', lastName: 'B',
      ageCategory: 'ADULT', documentType: 'PASSPORT',
      documentNumber: '123',
      gdprConsent: false,
    });
    expect(r.success).toBe(false);
  });

  it('submitGuestSchema accepts valid input with GDPR true', () => {
    const r = submitGuestSchema.parse({
      firstName: 'Anna', lastName: 'Novotná',
      ageCategory: 'ADULT', documentType: 'PASSPORT',
      documentNumber: 'X12345',
      gdprConsent: true,
    });
    expect(r.firstName).toBe('Anna');
  });

  it('submitRegistrationSchema requires at least 1 guest', () => {
    const r = submitRegistrationSchema.safeParse({
      tripId: 1, email: 'a@b.io',
      guests: [],
    });
    expect(r.success).toBe(false);
  });

  it('submitRegistrationSchema accepts up to 20 guests', () => {
    const guest = {
      firstName: 'A', lastName: 'B',
      ageCategory: 'ADULT' as const, documentType: 'PASSPORT' as const,
      documentNumber: '1',
      gdprConsent: true,
    };
    const r = submitRegistrationSchema.safeParse({
      tripId: 1, email: 'a@b.io',
      guests: Array.from({ length: 20 }, () => guest),
    });
    expect(r.success).toBe(true);
  });
});
