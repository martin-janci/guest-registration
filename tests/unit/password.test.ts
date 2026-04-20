import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/modules/auth/password';

describe('password', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(hash, 'correct horse battery staple')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
  });

  it('produces different hashes for same input (salt)', async () => {
    const a = await hashPassword('pw');
    const b = await hashPassword('pw');
    expect(a).not.toBe(b);
  });
});
