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
  const owner = await users.createUser({
    username: 'owner',
    email: 'o@example.com',
    password: 'secretpass!',
    role: 'ADMIN',
  });
  const prop = await properties.createProperty({
    name: 'P1',
    ownerId: owner.id,
    maxGuests: 4,
  });
  const cal = await calendars.createCalendar({
    propertyId: prop.id,
    name: 'Airbnb',
    icsUrl: 'https://www.airbnb.com/calendar/ical/1.ics?s=x',
    syncIntervalMin: 60,
  });
  return { owner, prop, cal };
}

describe('airbnb-sync syncCalendar', () => {
  it('creates trips for Reserved events and skips Not available blocks', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');

    const result = await syncCalendar(cal.id, {
      fetcher: async () => airbnbFixture,
    });
    expect(result.error).toBeNull();
    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(1);

    const allTrips = await ctx.prisma.trip.findMany({ orderBy: { externalReservationId: 'asc' } });
    expect(allTrips).toHaveLength(2);
    expect(allTrips.map((t) => t.source)).toEqual(['AIRBNB_ICS', 'AIRBNB_ICS']);
    expect(allTrips[0]!.externalConfirmCode).toBe('HMABC12345');

    const cals = await import('@/modules/calendars/service');
    const after = await cals.getCalendarById(cal.id);
    expect(after?.lastSyncedAt).not.toBeNull();
    expect(after?.lastSyncError).toBeNull();
  });

  it('is idempotent — running twice gives 0 created, N updated', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    const second = await syncCalendar(cal.id, { fetcher: async () => airbnbFixture });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(2);
  });

  it('records lastSyncError when the fetch fails', async () => {
    const { cal } = await seed();
    const { syncCalendar } = await import('@/modules/airbnb-sync');
    const failing: () => Promise<string> = async () => {
      throw new Error('HTTP 503');
    };
    const result = await syncCalendar(cal.id, { fetcher: failing });
    expect(result.error).toBe('HTTP 503');
    const cals = await import('@/modules/calendars/service');
    const after = await cals.getCalendarById(cal.id);
    expect(after?.lastSyncError).toBe('HTTP 503');
  });
});
