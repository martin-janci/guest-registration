import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.job.deleteMany();
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
    username: 'owner', email: 'o@example.com', password: 'secretpass!', role: 'ADMIN',
  });
  const prop = await properties.createProperty({ name: 'P1', ownerId: owner.id, maxGuests: 4 });
  const calA = await calendars.createCalendar({
    propertyId: prop.id, name: 'A',
    icsUrl: 'https://example.com/a.ics', syncIntervalMin: 60,
  });
  const calB = await calendars.createCalendar({
    propertyId: prop.id, name: 'B',
    icsUrl: 'https://example.com/b.ics', syncIntervalMin: 60,
  });
  return { owner, prop, calA, calB };
}

describe('enqueueDueAirbnbSyncs', () => {
  it('enqueues one job per calendar whose lastSyncedAt is null or stale', async () => {
    const { calA, calB } = await seed();
    const calendars = await import('@/modules/calendars/service');
    const { enqueueDueAirbnbSyncs } = await import('@/modules/scheduler');

    // calA has no lastSyncedAt yet — should be enqueued.
    // calB we mark as recently synced — should be skipped.
    await calendars.touchLastSynced(calB.id, { lastSyncedAt: new Date(), lastSyncError: null });

    const enqueued = await enqueueDueAirbnbSyncs();
    expect(enqueued).toBe(1);

    const jobs = await ctx.prisma.job.findMany({ where: { kind: 'AIRBNB_SYNC', status: 'PENDING' } });
    expect(jobs).toHaveLength(1);
    expect((jobs[0]!.payload as { calendarId: number }).calendarId).toBe(calA.id);
  });

  it('does not duplicate an existing PENDING job for the same calendar', async () => {
    const { calA, calB } = await seed();
    const { enqueueDueAirbnbSyncs } = await import('@/modules/scheduler');
    const jobs = await import('@/modules/jobs/service');

    // Pre-enqueue PENDING jobs for both calendars (both have null lastSyncedAt → due).
    await jobs.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: calA.id } });
    await jobs.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: calB.id } });

    const addedSecondTime = await enqueueDueAirbnbSyncs();
    expect(addedSecondTime).toBe(0);
    expect(await ctx.prisma.job.count()).toBe(2);
  });

  it('re-enqueues after the existing job is DONE', async () => {
    const { calA, calB } = await seed();
    const { enqueueDueAirbnbSyncs } = await import('@/modules/scheduler');
    const jobs = await import('@/modules/jobs/service');

    // Pre-enqueue for calA, mark it DONE; calB gets a PENDING job.
    const first = await jobs.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: calA.id } });
    await jobs.markDone(first.id);
    await jobs.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: calB.id } });

    // Only calA should be re-enqueued (calB already PENDING).
    const added = await enqueueDueAirbnbSyncs();
    expect(added).toBe(1);
  });
});
