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

describe('property-housekeepers service', () => {
  async function setup() {
    const users = await import('@/modules/users/service');
    const properties = await import('@/modules/properties/service');
    const owner = await users.createUser({
      username: 'owner',
      email: 'owner@example.com',
      password: 'secretpass!',
      role: 'ADMIN',
    });
    const hk1 = await users.createUser({
      username: 'hk1',
      email: 'hk1@example.com',
      password: 'secretpass!',
      role: 'HOUSEKEEPER',
    });
    const hk2 = await users.createUser({
      username: 'hk2',
      email: 'hk2@example.com',
      password: 'secretpass!',
      role: 'HOUSEKEEPER',
    });
    const prop = await properties.createProperty({
      name: 'Test property',
      ownerId: owner.id,
      maxGuests: 4,
    });
    return { owner, hk1, hk2, prop };
  }

  it('assigns, re-assigns (upsert), sets default, and unassigns', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/property-housekeepers/service');
    const { prop, hk1, hk2 } = await setup();

    await svc.assign({ propertyId: prop.id, housekeeperId: hk1.id, payOverride: '22.00' });
    await svc.assign({ propertyId: prop.id, housekeeperId: hk2.id });
    expect(await svc.listAssignments(prop.id)).toHaveLength(2);

    // Upsert path: re-assign hk1 with a different pay, should not duplicate.
    await svc.assign({ propertyId: prop.id, housekeeperId: hk1.id, payOverride: '25.00' });
    const after = await svc.listAssignments(prop.id);
    expect(after).toHaveLength(2);
    const hk1Row = after.find((r) => r.housekeeperId === hk1.id)!;
    expect(hk1Row.payOverride?.toString()).toBe('25');

    // setDefault flips the flag atomically for the whole property.
    await svc.setDefault(prop.id, hk2.id);
    const withDefault = await svc.listAssignments(prop.id);
    expect(withDefault.filter((r) => r.isDefault)).toHaveLength(1);
    expect(withDefault.find((r) => r.isDefault)?.housekeeperId).toBe(hk2.id);

    await svc.setDefault(prop.id, hk1.id);
    const flipped = await svc.listAssignments(prop.id);
    expect(flipped.find((r) => r.isDefault)?.housekeeperId).toBe(hk1.id);

    // Unassign
    await svc.unassign(prop.id, hk2.id);
    expect(await svc.listAssignments(prop.id)).toHaveLength(1);
  });
});
