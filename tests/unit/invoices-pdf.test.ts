import { describe, it, expect } from 'vitest';
import { renderInvoicePdf } from '@/modules/invoices/pdf-render';

describe('renderInvoicePdf', () => {
  it('returns a Buffer beginning with %PDF-', async () => {
    const buf = await renderInvoicePdf({
      invoiceNumber: '2026-0001',
      issueDate: '2026-05-10',
      dueDate: '2026-05-24',
      currency: 'EUR',
      clientName: 'Acme GmbH',
      clientEmail: 'billing@acme.example',
      clientVatNumber: 'DE123456789',
      clientAddress: '1 Acme Street\nBerlin',
      items: [
        { description: 'Stay', quantity: '2', unitPrice: '100.00', vatRate: '20', lineTotal: '200.00', totalWithVat: '240.00' },
        { description: 'Cleaning', quantity: '1', unitPrice: '50.00', vatRate: '20', lineTotal: '50.00', totalWithVat: '60.00' },
      ],
      subtotal: '250.00',
      vatTotal: '50.00',
      totalAmount: '300.00',
      notes: 'Thanks!',
      brand: {
        companyName: 'My Apartments s.r.o.',
        companyIco: '12345678',
        companyVat: 'SK1234567890',
        contactName: 'Martin',
        contactAddress: 'Prievidzská 1\n04001 Košice',
        contactPhone: '+421 900 000 000',
        contactWebsite: 'airbnb.rlt.sk',
        customLine1: 'Payment to IBAN SK00 0000 0000 0000 0000 0000',
        customLine2: null,
        customLine3: null,
      },
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  }, 20_000);
});
