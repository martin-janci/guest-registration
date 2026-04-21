import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

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

describe('calendars service', () => {
  async function setup() {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const properties = await import('@/modules/properties/service');
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
    return { owner, prop };
  }

  it('creates, lists, updates, and deletes a calendar', async () => {
    const { prop } = await setup();
    const svc = await import('@/modules/calendars/service');

    const created = await svc.createCalendar({
      propertyId: prop.id,
      name: 'Airbnb',
      icsUrl: 'https://www.airbnb.com/calendar/ical/1.ics?s=x',
      syncIntervalMin: 60,
    });

    const listed = await svc.listCalendars();
    expect(listed).toHaveLength(1);
    expect(listed[0]!.property.name).toBe('P1');

    const updated = await svc.updateCalendar(created.id, {
      name: 'Airbnb (renamed)',
      icsUrl: created.icsUrl,
      syncIntervalMin: 120,
    });
    expect(updated.name).toBe('Airbnb (renamed)');

    await svc.deleteCalendar(created.id);
    expect(await svc.listCalendars()).toHaveLength(0);
  });

  it('touchLastSynced updates sync metadata', async () => {
    const { prop } = await setup();
    const svc = await import('@/modules/calendars/service');

    const cal = await svc.createCalendar({
      propertyId: prop.id,
      name: 'A',
      icsUrl: 'https://example.com/a.ics',
      syncIntervalMin: 60,
    });

    const at = new Date('2026-04-20T12:00:00Z');
    await svc.touchLastSynced(cal.id, { lastSyncedAt: at, lastSyncError: null });

    const after = await svc.getCalendarById(cal.id);
    expect(after?.lastSyncedAt?.toISOString()).toBe(at.toISOString());
    expect(after?.lastSyncError).toBeNull();

    await svc.touchLastSynced(cal.id, { lastSyncedAt: at, lastSyncError: 'HTTP 503' });
    const errored = await svc.getCalendarById(cal.id);
    expect(errored?.lastSyncError).toBe('HTTP 503');
  });
});
