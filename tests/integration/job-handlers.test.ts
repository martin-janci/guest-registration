import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.invoiceItem.deleteMany();
  await ctx.prisma.invoice.deleteMany();
  await ctx.prisma.housekeepingPhoto.deleteMany();
  await ctx.prisma.housekeepingTask.deleteMany();
  await ctx.prisma.trip.deleteMany();
  await ctx.prisma.calendar.deleteMany();
  await ctx.prisma.propertyHousekeeper.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
  await ctx.prisma.job.deleteMany();
});

describe('invoiceOverdueFlipHandler', () => {
  it('flips SENT invoices with dueDate<today to OVERDUE and leaves others alone', async () => {
    process.env.DATABASE_URL = ctx.url;
    const users = await import('@/modules/users/service');
    const invoices = await import('@/modules/invoices/service');
    const { invoiceOverdueFlipHandler } = await import('@/modules/jobs/handlers/invoice-overdue-flip');

    const owner = await users.createUser({
      username: 'owner', email: 'o@example.com', password: 'secretpass!', role: 'ADMIN',
    });

    const past = await invoices.createInvoice(owner.id, {
      clientName: 'Past', issueDate: new Date('2026-01-01T00:00:00Z'),
      dueDate: new Date('2026-01-10T00:00:00Z'), currency: 'EUR',
    });
    await invoices.markSent(past.id);

    const future = await invoices.createInvoice(owner.id, {
      clientName: 'Future', issueDate: new Date('2099-01-01T00:00:00Z'),
      dueDate: new Date('2099-01-10T00:00:00Z'), currency: 'EUR',
    });
    await invoices.markSent(future.id);

    const paid = await invoices.createInvoice(owner.id, {
      clientName: 'Paid', issueDate: new Date('2026-01-01T00:00:00Z'),
      dueDate: new Date('2026-01-10T00:00:00Z'), currency: 'EUR',
    });
    await invoices.markSent(paid.id);
    await invoices.markPaid(paid.id);

    await invoiceOverdueFlipHandler();

    const pastAfter = await ctx.prisma.invoice.findUniqueOrThrow({ where: { id: past.id } });
    const futureAfter = await ctx.prisma.invoice.findUniqueOrThrow({ where: { id: future.id } });
    const paidAfter = await ctx.prisma.invoice.findUniqueOrThrow({ where: { id: paid.id } });

    expect(pastAfter.status).toBe('OVERDUE');
    expect(futureAfter.status).toBe('SENT');
    expect(paidAfter.status).toBe('PAID');
  });
});

describe('airbnbSyncHandler', () => {
  it('throws when payload has no calendarId', async () => {
    const { airbnbSyncHandler } = await import('@/modules/jobs/handlers/airbnb-sync');
    await expect(airbnbSyncHandler({})).rejects.toThrow();
  });
});
