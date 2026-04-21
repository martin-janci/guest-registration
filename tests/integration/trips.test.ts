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

async function seed() {
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

describe('trips service', () => {
  it('create assigns a confirm code and MANUAL source', async () => {
    const { owner, prop } = await seed();
    const svc = await import('@/modules/trips/service');

    const trip = await svc.createTrip(owner.id, {
      title: 'First stay',
      propertyId: prop.id,
      startDate: new Date('2026-05-10T00:00:00Z'),
      endDate: new Date('2026-05-12T00:00:00Z'),
      maxGuests: 2,
    });
    expect(trip.source).toBe('MANUAL');
    expect(trip.externalConfirmCode).toMatch(/^[A-Za-z0-9]{10}$/);
  });

  it('list filters by property, source, and date range; excludes past by default', async () => {
    const { owner, prop } = await seed();
    const svc = await import('@/modules/trips/service');

    const past = await svc.createTrip(owner.id, {
      title: 'Past',
      propertyId: prop.id,
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-03T00:00:00Z'),
      maxGuests: 2,
    });
    const future = await svc.createTrip(owner.id, {
      title: 'Future',
      propertyId: prop.id,
      startDate: new Date('2099-01-01T00:00:00Z'),
      endDate: new Date('2099-01-03T00:00:00Z'),
      maxGuests: 2,
    });

    const def = await svc.listTrips(owner.id);
    expect(def.map((t) => t.id)).toEqual([future.id]);

    const all = await svc.listTrips(owner.id, { includePast: true });
    expect(all.map((t) => t.id).sort()).toEqual([past.id, future.id].sort());
  });

  it('upsertExternalTrip creates then updates by externalReservationId', async () => {
    const { owner, prop } = await seed();
    const trips = await import('@/modules/trips/service');
    const calendars = await import('@/modules/calendars/service');

    const cal = await calendars.createCalendar({
      propertyId: prop.id,
      name: 'Airbnb',
      icsUrl: 'https://example.com/a.ics',
      syncIntervalMin: 60,
    });

    const first = await trips.upsertExternalTrip({
      adminId: owner.id,
      propertyId: prop.id,
      calendarId: cal.id,
      source: 'AIRBNB_ICS',
      externalReservationId: 'airbnb-HMABC@airbnb.com',
      externalConfirmCode: 'HMABC',
      externalGuestName: 'Anna',
      externalGuestCount: 2,
      startDate: new Date('2026-05-10T00:00:00Z'),
      endDate: new Date('2026-05-12T00:00:00Z'),
      title: 'Airbnb HMABC',
      maxGuests: 4,
    });
    expect(first.created).toBe(true);

    const second = await trips.upsertExternalTrip({
      adminId: owner.id,
      propertyId: prop.id,
      calendarId: cal.id,
      source: 'AIRBNB_ICS',
      externalReservationId: 'airbnb-HMABC@airbnb.com',
      externalConfirmCode: 'HMABC',
      externalGuestName: 'Anna Novotná',
      externalGuestCount: 3,
      startDate: new Date('2026-05-10T00:00:00Z'),
      endDate: new Date('2026-05-13T00:00:00Z'),
      title: 'Airbnb HMABC (extended)',
      maxGuests: 4,
    });
    expect(second.created).toBe(false);
    expect(second.trip.id).toBe(first.trip.id);
    expect(second.trip.externalGuestName).toBe('Anna Novotná');
    expect(second.trip.endDate.toISOString().slice(0, 10)).toBe('2026-05-13');
  });
});
