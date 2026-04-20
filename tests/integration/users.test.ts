import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

describe('users service', () => {
  it('creates, lists, updates, soft-deletes, and restores a user', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/users/service');

    const created = await svc.createUser({
      username: 'housekeeper1',
      email: 'hk1@example.com',
      password: 'secretpass!',
      role: 'HOUSEKEEPER',
    });
    expect(created.username).toBe('housekeeper1');
    expect((created as { passwordHash?: string }).passwordHash).toBeUndefined();

    const listed = await svc.listUsers();
    expect(listed).toHaveLength(1);

    const updated = await svc.updateUser(created.id, {
      username: 'housekeeper1',
      email: 'new@example.com',
      role: 'HOUSEKEEPER',
    });
    expect(updated.email).toBe('new@example.com');

    const deleted = await svc.softDeleteUser(created.id);
    expect(deleted.deletedAt).not.toBeNull();

    const activeOnly = await svc.listUsers();
    expect(activeOnly).toHaveLength(0);
    const withDeleted = await svc.listUsers({ includeDeleted: true });
    expect(withDeleted).toHaveLength(1);

    const restored = await svc.restoreUser(created.id);
    expect(restored.deletedAt).toBeNull();
  });

  it('invalidates sessions when a user is soft-deleted', async () => {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const session = await import('@/modules/auth/session');

    const u = await users.createUser({
      username: 'walker',
      email: 'w@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const token = session.generateSessionToken();
    await session.createSession(token, u.id);
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(1);

    await users.softDeleteUser(u.id);
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(0);
  });

  it('invalidates sessions when password is reset', async () => {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const session = await import('@/modules/auth/session');

    const u = await users.createUser({
      username: 'rotate',
      email: 'r@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const token = session.generateSessionToken();
    await session.createSession(token, u.id);
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(1);

    await users.resetUserPassword(u.id, { newPassword: 'brand-new-pw-01' });
    expect(await ctx.prisma.session.count({ where: { userId: u.id } })).toBe(0);
  });
});
