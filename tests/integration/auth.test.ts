import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startPg } from '../setup/pg-container.js';
import { hashPassword } from '@/modules/auth/password';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });

describe('login', () => {
  it('accepts correct password and creates a session', async () => {
    process.env.DATABASE_URL = ctx.url;
    const { login } = await import('@/modules/auth/login');

    await ctx.prisma.user.create({
      data: {
        username: 'admin',
        email: 'a@example.com',
        passwordHash: await hashPassword('s3cret'),
        role: 'ADMIN',
      },
    });

    const result = await login('admin', 's3cret');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { hashSessionToken } = await import('@/modules/auth/session');
      const sessions = await ctx.prisma.session.findMany();
      expect(sessions).toHaveLength(1);
      expect(hashSessionToken(result.token)).toBe(sessions[0]!.id);
    }
  });

  it('rejects wrong password', async () => {
    process.env.DATABASE_URL = ctx.url;
    const { login } = await import('@/modules/auth/login');
    const result = await login('admin', 'wrong');
    expect(result.ok).toBe(false);
  });

  it('rejects unknown user in constant time-ish', async () => {
    process.env.DATABASE_URL = ctx.url;
    const { login } = await import('@/modules/auth/login');
    const result = await login('nobody', 'whatever');
    expect(result.ok).toBe(false);
  });
});
