import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.housekeepingPhoto.deleteMany();
  await ctx.prisma.housekeepingTask.deleteMany();
  await ctx.prisma.invoiceItem.deleteMany();
  await ctx.prisma.invoice.deleteMany();
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
  const assignments = await import('@/modules/property-housekeepers/service');

  const owner = await users.createUser({ username: 'owner', email: 'o@example.com', password: 'secretpass!', role: 'ADMIN' });
  const hk = await users.createUser({ username: 'hk1', email: 'hk@example.com', password: 'secretpass!', role: 'HOUSEKEEPER' });
  const prop = await properties.createProperty({ name: 'P1', ownerId: owner.id, maxGuests: 4 });
  await assignments.assign({ propertyId: prop.id, housekeeperId: hk.id, isDefault: true, payOverride: '22.00' });
  const trip = await trips.createTrip(owner.id, {
    title: 'Stay', propertyId: prop.id,
    startDate: new Date('2099-05-10T00:00:00Z'), endDate: new Date('2099-05-12T00:00:00Z'),
    maxGuests: 4,
  });
  return { owner, hk, prop, trip };
}

describe('housekeeping service', () => {
  it('createTask + listTasksForHousekeeper returns the task', async () => {
    const { hk, trip } = await seed();
    const svc = await import('@/modules/housekeeping/service');

    const task = await svc.createTask({
      tripId: trip.id, housekeeperId: hk.id,
      date: new Date('2099-05-12T00:00:00Z'), payAmount: '22.00',
    });
    expect(task.status).toBe('PENDING');
    expect(task.paid).toBe(false);

    const list = await svc.listTasksForHousekeeper(hk.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.trip.property.name).toBe('P1');
  });

  it('createTaskForTrip uses the default housekeeper + pay override', async () => {
    const { hk, trip } = await seed();
    const svc = await import('@/modules/housekeeping/service');
    const task = await svc.createTaskForTrip(trip.id);
    expect(task).not.toBeNull();
    expect(task!.housekeeperId).toBe(hk.id);
    expect(task!.payAmount.toFixed(2)).toBe('22.00');
    expect(task!.date.toISOString().slice(0, 10)).toBe('2099-05-12');
  });

  it('createTaskForTrip returns null if property has no housekeeper', async () => {
    const { owner } = await seed();
    const properties = await import('@/modules/properties/service');
    const trips = await import('@/modules/trips/service');
    const svc = await import('@/modules/housekeeping/service');
    const prop2 = await properties.createProperty({ name: 'P2', ownerId: owner.id, maxGuests: 2 });
    const trip2 = await trips.createTrip(owner.id, {
      title: 'Solo', propertyId: prop2.id,
      startDate: new Date('2099-06-01T00:00:00Z'), endDate: new Date('2099-06-02T00:00:00Z'),
      maxGuests: 2,
    });
    expect(await svc.createTaskForTrip(trip2.id)).toBeNull();
  });

  it('updateTaskStatus sets startedAt and completedAt', async () => {
    const { hk, trip } = await seed();
    const svc = await import('@/modules/housekeeping/service');
    const task = await svc.createTask({
      tripId: trip.id, housekeeperId: hk.id,
      date: new Date('2099-05-12T00:00:00Z'), payAmount: '22.00',
    });
    const started = await svc.updateTaskStatus(task.id, 'IN_PROGRESS');
    expect(started.startedAt).not.toBeNull();
    expect(started.completedAt).toBeNull();
    const completed = await svc.updateTaskStatus(task.id, 'COMPLETED');
    expect(completed.completedAt).not.toBeNull();
  });

  it('markPaid toggle', async () => {
    const { hk, trip } = await seed();
    const svc = await import('@/modules/housekeeping/service');
    const task = await svc.createTask({
      tripId: trip.id, housekeeperId: hk.id,
      date: new Date('2099-05-12T00:00:00Z'), payAmount: '22.00',
    });
    const paid = await svc.markPaid(task.id, true);
    expect(paid.paid).toBe(true);
    expect(paid.paidAt).not.toBeNull();
    const unpaid = await svc.markPaid(task.id, false);
    expect(unpaid.paid).toBe(false);
    expect(unpaid.paidAt).toBeNull();
  });

  it('addPhoto + deletePhoto', async () => {
    const { hk, trip } = await seed();
    const svc = await import('@/modules/housekeeping/service');
    const task = await svc.createTask({
      tripId: trip.id, housekeeperId: hk.id,
      date: new Date('2099-05-12T00:00:00Z'), payAmount: '22.00',
    });
    const photo = await svc.addPhoto(task.id, 'housekeeping/' + task.id + '/abc.jpg');
    expect(photo.storageKey).toContain('housekeeping/');
    const fetched = await svc.getTaskById(task.id);
    expect(fetched?.photos).toHaveLength(1);
    await svc.deletePhoto(photo.id);
    const after = await svc.getTaskById(task.id);
    expect(after?.photos).toHaveLength(0);
  });

  it('countUnpaidForAdmin counts only COMPLETED+unpaid tasks', async () => {
    const { owner, hk, trip } = await seed();
    const svc = await import('@/modules/housekeeping/service');
    const t1 = await svc.createTask({
      tripId: trip.id, housekeeperId: hk.id, date: new Date('2099-05-12T00:00:00Z'), payAmount: '22.00',
    });
    expect(await svc.countUnpaidForAdmin(owner.id)).toBe(0);
    await svc.updateTaskStatus(t1.id, 'COMPLETED');
    expect(await svc.countUnpaidForAdmin(owner.id)).toBe(1);
    await svc.markPaid(t1.id, true);
    expect(await svc.countUnpaidForAdmin(owner.id)).toBe(0);
  });
});
