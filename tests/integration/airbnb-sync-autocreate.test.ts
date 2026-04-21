import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startPg } from '../setup/pg-container.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const airbnbFixture = readFileSync(
  join(__dirname, '..', '..', 'src', 'modules', 'ics-parser', 'fixtures', 'airbnb.ics'),
  'utf8',
);

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.housekeepingPhoto.deleteMany();
  await ctx.prisma.housekeepingTask.deleteMany();
  await ctx.prisma.trip.deleteMany();
  await ctx.prisma.calendar.deleteMany();
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
});

async function seed() {
  process.env.DATABASE_URL = ctx.url;
  const users = await import('@/modules/users/service');
  const properties = await import('@/modules/properties/service');
  const calendars = await import('@/modules/calendars/service');
  const assignments = await import('@/modules/property-housekeepers/service');
  const owner = await users.createUser({ username: 'owner', email: 'o@example.com', password: 'secretpass!', role: 'ADMIN' });
  const hk = await users.createUser({ username: 'hk1', email: 'hk@example.com', password: 'secretpass!', role: 'HOUSEKEEPER' });
  const prop = await properties.createProperty({ name: 'P1', ownerId: owner.id, maxGuests: 4 });
  await assignments.assign({ propertyId: prop.id, housekeeperId: hk.id, isDefault: true, payOverride: '22.00' });
  const cal = await calendars.createCalendar({
    propertyId: prop.id, name: 'Airbnb',
    icsUrl: 'https://www.airbnb.com/calendar/ical/1.ics?s=x', syncIntervalMin: 60,
  });
  return { owner, hk, prop, cal };
}

describe('airbnb-sync auto-create housekeeping tasks', () => {
  it('creates one housekeeping task per new reservation', async () => {
    const { cal, hk } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    const result = await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    expect(result.created).toBe(2);
    expect(result.skipped).toBe(1);
    const tasks = await ctx.prisma.housekeepingTask.findMany({ orderBy: { date: 'asc' } });
    expect(tasks).toHaveLength(2);
    for (const t of tasks) expect(t.housekeeperId).toBe(hk.id);
  });

  it('second sync is idempotent', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    const firstCount = await ctx.prisma.housekeepingTask.count();
    const second = await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    expect(second.created).toBe(0);
    expect(await ctx.prisma.housekeepingTask.count()).toBe(firstCount);
  });

  it('skips for properties without a default housekeeper', async () => {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const properties = await import('@/modules/properties/service');
    const calendars = await import('@/modules/calendars/service');
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    const owner = await users.createUser({ username: 'owner2', email: 'o2@example.com', password: 'secretpass!', role: 'ADMIN' });
    const prop = await properties.createProperty({ name: 'No-HK', ownerId: owner.id, maxGuests: 2 });
    const cal = await calendars.createCalendar({
      propertyId: prop.id, name: 'Airbnb',
      icsUrl: 'https://www.airbnb.com/calendar/ical/1.ics?s=x', syncIntervalMin: 60,
    });
    const r = await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    expect(r.created).toBe(2);
    expect(await ctx.prisma.housekeepingTask.count()).toBe(0);
  });
});
