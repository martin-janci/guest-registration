import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.guest.deleteMany();
  await ctx.prisma.registration.deleteMany();
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
  const trips = await import('@/modules/trips/service');

  const owner = await users.createUser({
    username: 'owner', email: 'o@example.com', password: 'secretpass!', role: 'ADMIN',
  });
  const prop = await properties.createProperty({
    name: 'P1', ownerId: owner.id, maxGuests: 4,
  });
  const trip = await trips.createTrip(owner.id, {
    title: 'Stay', propertyId: prop.id,
    startDate: new Date('2099-05-10T00:00:00Z'),
    endDate: new Date('2099-05-12T00:00:00Z'),
    maxGuests: 4,
  });
  return { owner, prop, trip };
}

describe('registrations service', () => {
  it('submits a registration with N guests and lists PENDING by default', async () => {
    const { trip } = await seed();
    const svc = await import('@/modules/registrations/service');

    const reg = await svc.submitRegistration(
      {
        tripId: trip.id,
        email: 'guest@example.com',
        guests: [
          { firstName: 'Anna', lastName: 'Novotná', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: 'X1', gdprConsent: true },
          { firstName: 'Tomáš', lastName: 'Novotný', ageCategory: 'CHILD', documentType: 'CITIZEN_ID', documentNumber: 'C2', gdprConsent: true },
        ],
      },
      [
        { firstName: 'Anna', lastName: 'Novotná', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: 'X1', documentImageKey: 'k/1.jpg', gdprConsent: true },
        { firstName: 'Tomáš', lastName: 'Novotný', ageCategory: 'CHILD', documentType: 'CITIZEN_ID', documentNumber: 'C2', documentImageKey: null, gdprConsent: true },
      ],
    );
    expect(reg.status).toBe('PENDING');
    expect(reg.guests).toHaveLength(2);
    const firstGuest = reg.guests.find((g) => g.firstName === 'Anna')!;
    expect(firstGuest.documentImageKey).toBe('k/1.jpg');

    const listed = await svc.listRegistrations({ status: 'PENDING' });
    expect(listed).toHaveLength(1);
  });

  it('getTripByConfirmCode returns trip when confirm code matches', async () => {
    const { trip } = await seed();
    const svc = await import('@/modules/registrations/service');
    const found = await svc.getTripByConfirmCode(trip.externalConfirmCode!);
    expect(found?.id).toBe(trip.id);
    expect(found?.property.name).toBe('P1');
    expect(await svc.getTripByConfirmCode('NOPE')).toBeNull();
  });

  it('approveRegistration flips status and records reviewer', async () => {
    const { owner, trip } = await seed();
    const svc = await import('@/modules/registrations/service');
    const reg = await svc.submitRegistration(
      {
        tripId: trip.id,
        email: 'g@example.com',
        guests: [{ firstName: 'A', lastName: 'B', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: '1', gdprConsent: true }],
      },
      [{ firstName: 'A', lastName: 'B', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: '1', documentImageKey: 'k/a.jpg', gdprConsent: true }],
    );

    const approved = await svc.approveRegistration(reg.id, owner.id, 'Welcome!');
    expect(approved.status).toBe('APPROVED');
    expect(approved.reviewedBy).toBe(owner.id);
    expect(approved.adminComment).toBe('Welcome!');
    expect(approved.reviewedAt).not.toBeNull();
  });

  it('countSubmissionsForTrip excludes REJECTED', async () => {
    const { owner, trip } = await seed();
    const svc = await import('@/modules/registrations/service');

    const r1 = await svc.submitRegistration(
      { tripId: trip.id, email: 'g1@e.io', guests: [{ firstName: 'A', lastName: 'B', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: '1', gdprConsent: true }] },
      [{ firstName: 'A', lastName: 'B', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: '1', documentImageKey: null, gdprConsent: true }],
    );
    await svc.submitRegistration(
      { tripId: trip.id, email: 'g2@e.io', guests: [{ firstName: 'C', lastName: 'D', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: '2', gdprConsent: true }] },
      [{ firstName: 'C', lastName: 'D', ageCategory: 'ADULT', documentType: 'PASSPORT', documentNumber: '2', documentImageKey: null, gdprConsent: true }],
    );

    expect(await svc.countSubmissionsForTrip(trip.id)).toBe(2);

    await svc.rejectRegistration(r1.id, owner.id, 'Invalid doc');
    expect(await svc.countSubmissionsForTrip(trip.id)).toBe(1);
  });
});
