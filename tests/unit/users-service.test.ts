import { describe, it, expect } from 'vitest';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from '@/modules/users/schema';

describe('users schemas', () => {
  it('createUserSchema rejects short passwords', () => {
    const r = createUserSchema.safeParse({
      username: 'ok',
      email: 'x@y.z',
      password: 'short',
      role: 'ADMIN',
    });
    expect(r.success).toBe(false);
  });

  it('createUserSchema accepts valid input and defaults role to ADMIN', () => {
    const r = createUserSchema.parse({
      username: 'someone',
      email: 'some@one.io',
      password: 'a-valid-password',
    });
    expect(r.role).toBe('ADMIN');
  });

  it('updateUserSchema requires role explicitly', () => {
    const ok = updateUserSchema.safeParse({
      username: 'a',
      email: 'b@c.io',
      role: 'HOUSEKEEPER',
    });
    expect(ok.success).toBe(false); // username min 3
    const ok2 = updateUserSchema.parse({
      username: 'abc',
      email: 'b@c.io',
      role: 'HOUSEKEEPER',
    });
    expect(ok2.role).toBe('HOUSEKEEPER');
  });

  it('resetPasswordSchema enforces min length', () => {
    expect(resetPasswordSchema.safeParse({ newPassword: '1234' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ newPassword: 'longenoughpw' }).success).toBe(true);
  });
});
