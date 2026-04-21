import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
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
  const owner = await users.createUser({
    username: 'owner', email: 'o@example.com', password: 'secretpass!', role: 'ADMIN',
  });
  return { owner };
}

describe('invoices service', () => {
  it('creates an invoice with auto-numbered invoiceNumber', async () => {
    const { owner } = await seed();
    const svc = await import('@/modules/invoices/service');

    const a = await svc.createInvoice(owner.id, {
      clientName: 'Acme',
      issueDate: new Date('2026-05-10T00:00:00Z'),
      currency: 'EUR',
    });
    const b = await svc.createInvoice(owner.id, {
      clientName: 'Beta',
      issueDate: new Date('2026-05-11T00:00:00Z'),
      currency: 'EUR',
    });
    expect(a.invoiceNumber).toBe('2026-0001');
    expect(b.invoiceNumber).toBe('2026-0002');
  });

  it('addItem recomputes invoice totals', async () => {
    const { owner } = await seed();
    const svc = await import('@/modules/invoices/service');
    const inv = await svc.createInvoice(owner.id, {
      clientName: 'Acme',
      issueDate: new Date('2026-05-10T00:00:00Z'),
      currency: 'EUR',
    });

    await svc.addItem(inv.id, { description: 'Stay', quantity: '2', unitPrice: '100.00', vatRate: '20' });
    await svc.addItem(inv.id, { description: 'Fee', quantity: '1', unitPrice: '10.00', vatRate: '0' });

    const fetched = await svc.getInvoiceById(inv.id);
    expect(fetched?.items).toHaveLength(2);
    expect(fetched?.subtotal.toFixed(2)).toBe('210.00');
    expect(fetched?.vatTotal.toFixed(2)).toBe('40.00');
    expect(fetched?.totalAmount.toFixed(2)).toBe('250.00');
  });

  it('updateItem and deleteItem both keep totals in sync', async () => {
    const { owner } = await seed();
    const svc = await import('@/modules/invoices/service');
    const inv = await svc.createInvoice(owner.id, {
      clientName: 'Acme',
      issueDate: new Date('2026-05-10T00:00:00Z'),
      currency: 'EUR',
    });
    const i1 = await svc.addItem(inv.id, { description: 'A', quantity: '1', unitPrice: '50.00', vatRate: '20' });
    await svc.addItem(inv.id, { description: 'B', quantity: '1', unitPrice: '50.00', vatRate: '20' });

    await svc.updateItem(i1.id, { description: 'A2', quantity: '2', unitPrice: '50.00', vatRate: '20' });
    let fetched = await svc.getInvoiceById(inv.id);
    expect(fetched?.subtotal.toFixed(2)).toBe('150.00');

    await svc.deleteItem(i1.id);
    fetched = await svc.getInvoiceById(inv.id);
    expect(fetched?.items).toHaveLength(1);
    expect(fetched?.subtotal.toFixed(2)).toBe('50.00');
  });

  it('markSent and markPaid transition status and timestamps', async () => {
    const { owner } = await seed();
    const svc = await import('@/modules/invoices/service');
    const inv = await svc.createInvoice(owner.id, {
      clientName: 'Acme',
      issueDate: new Date('2026-05-10T00:00:00Z'),
      currency: 'EUR',
    });

    const sent = await svc.markSent(inv.id);
    expect(sent.status).toBe('SENT');
    expect(sent.sentAt).not.toBeNull();

    const paid = await svc.markPaid(inv.id);
    expect(paid.status).toBe('PAID');
    expect(paid.paidAt).not.toBeNull();
  });

  it('countOverdueForAdmin counts SENT invoices past dueDate', async () => {
    const { owner } = await seed();
    const svc = await import('@/modules/invoices/service');

    const past = await svc.createInvoice(owner.id, {
      clientName: 'A',
      issueDate: new Date('2026-01-01T00:00:00Z'),
      dueDate: new Date('2026-01-10T00:00:00Z'),
      currency: 'EUR',
    });
    await svc.markSent(past.id);

    await svc.createInvoice(owner.id, {
      clientName: 'B',
      issueDate: new Date('2099-01-01T00:00:00Z'),
      dueDate: new Date('2099-01-10T00:00:00Z'),
      currency: 'EUR',
    });

    expect(await svc.countOverdueForAdmin(owner.id, new Date('2026-05-01T00:00:00Z'))).toBe(1);
    expect(await svc.countOverdueForAdmin(owner.id, new Date('2025-12-01T00:00:00Z'))).toBe(0);
  });
});
