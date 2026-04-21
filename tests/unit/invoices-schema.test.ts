import { describe, it, expect } from 'vitest';
import {
  createInvoiceSchema,
  updateInvoiceHeaderSchema,
  itemSchema,
  invoiceFiltersSchema,
} from '@/modules/invoices/schema';

describe('invoices schemas', () => {
  it('createInvoiceSchema accepts a minimal valid payload with currency default', () => {
    const r = createInvoiceSchema.parse({
      clientName: 'Acme',
      issueDate: '2026-05-10',
    });
    expect(r.currency).toBe('EUR');
    expect(r.issueDate.toISOString().slice(0, 10)).toBe('2026-05-10');
  });

  it('createInvoiceSchema rejects bad email', () => {
    expect(
      createInvoiceSchema.safeParse({
        clientName: 'Acme',
        issueDate: '2026-05-10',
        clientEmail: 'not-an-email',
      }).success,
    ).toBe(false);
  });

  it('updateInvoiceHeaderSchema requires currency', () => {
    expect(
      updateInvoiceHeaderSchema.safeParse({
        clientName: 'Acme',
        issueDate: '2026-05-10',
      }).success,
    ).toBe(false);
  });

  it('itemSchema rejects non-numeric quantity', () => {
    expect(
      itemSchema.safeParse({
        description: 'Cleaning',
        quantity: 'two',
        unitPrice: '50',
        vatRate: '20',
      }).success,
    ).toBe(false);
  });

  it('itemSchema accepts decimals with up to 2 places', () => {
    const r = itemSchema.parse({
      description: 'Housekeeping',
      quantity: '1.5',
      unitPrice: '25.00',
      vatRate: '10',
    });
    expect(r.quantity).toBe('1.5');
  });

  it('invoiceFiltersSchema accepts optional status', () => {
    expect(invoiceFiltersSchema.parse({}).status).toBeUndefined();
    expect(invoiceFiltersSchema.parse({ status: 'PAID' }).status).toBe('PAID');
  });
});
