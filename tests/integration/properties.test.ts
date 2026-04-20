import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

describe('properties service', () => {
  async function seedOwner() {
    const { createUser } = await import('@/modules/users/service');
    const u = await createUser({
      username: 'owner',
      email: 'owner@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    return u;
  }

  it('creates, lists, updates, soft-deletes, and restores a property', async () => {
    process.env.DATABASE_URL = ctx.url;
    const owner = await seedOwner();
    const svc = await import('@/modules/properties/service');

    const created = await svc.createProperty({
      name: 'Tatranská Perla — Apt 2B',
      ownerId: owner.id,
      maxGuests: 4,
    });
    expect(created.name).toContain('Tatranská Perla');

    const listed = await svc.listProperties();
    expect(listed).toHaveLength(1);
    expect(listed[0]!.owner.username).toBe('owner');

    const updated = await svc.updateProperty(created.id, {
      name: 'Tatranská Perla — Apt 2B (renovated)',
      maxGuests: 5,
    });
    expect(updated.maxGuests).toBe(5);

    const deleted = await svc.softDeleteProperty(created.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(await svc.listProperties()).toHaveLength(0);
    expect(await svc.listProperties({ includeDeleted: true })).toHaveLength(1);

    const restored = await svc.restoreProperty(created.id);
    expect(restored.deletedAt).toBeNull();
  });
});
