import { describe, it, expect } from 'vitest';
import { profileSchema, passwordChangeSchema } from '@/modules/settings/schema';

describe('settings schemas', () => {
  it('profileSchema trims empty strings to undefined', () => {
    const r = profileSchema.parse({
      companyName: '   ',
      photoRequiredAdults: 'true',
      photoRequiredChildren: 'false',
      dateFormat: 'd.M.y',
      defaultHousekeeperPay: '22.50',
    });
    expect(r.companyName).toBeUndefined();
    expect(r.photoRequiredAdults).toBe(true);
    expect(r.photoRequiredChildren).toBe(false);
    expect(r.defaultHousekeeperPay).toBe('22.50');
  });

  it('profileSchema rejects bad pay format', () => {
    expect(
      profileSchema.safeParse({
        photoRequiredAdults: 'true',
        photoRequiredChildren: 'true',
        dateFormat: 'd.M.y',
        defaultHousekeeperPay: 'free',
      }).success,
    ).toBe(false);
  });

  it('passwordChangeSchema requires min 8 for new', () => {
    expect(
      passwordChangeSchema.safeParse({ currentPassword: 'x', newPassword: '1234' }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({ currentPassword: 'x', newPassword: 'valid-pw' }).success,
    ).toBe(true);
  });
});
