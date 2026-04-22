import { describe, it, expect } from 'vitest';
import { renderInvoicePdf } from '@/modules/invoices/pdf-render';
import { pdfDicts } from '@/lib/i18n/pdf-dict';

const fixture = {
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
  notes: 'Ďakujeme',
  brand: {
    companyName: 'My Apartments s.r.o.',
    companyIco: '12345678',
    companyVat: 'SK1234567890',
    contactName: 'Martin',
    contactAddress: 'Prievidzská 1\n04001 Košice',
    contactPhone: '+421 900 000 000',
    contactWebsite: 'airbnb.rlt.sk',
    customLine1: 'Platba na IBAN SK00 0000 0000 0000 0000 0000',
    customLine2: null,
    customLine3: null,
  },
};

describe('pdfDicts', () => {
  it('sk uses legal Slovak VAT terms', () => {
    expect(pdfDicts.sk.totals.subtotal).toBe('Základ dane');
    expect(pdfDicts.sk.totals.vat).toBe('DPH spolu');
    expect(pdfDicts.sk.totals.total).toBe('Celkom k úhrade');
  });

  it('sk title is Faktúra', () => {
    expect(pdfDicts.sk.title).toBe('Faktúra');
  });

  it('en uses English terms', () => {
    expect(pdfDicts.en.totals.subtotal).toBe('Subtotal');
    expect(pdfDicts.en.totals.total).toBe('Total due');
  });

  it('cs uses Czech VAT terms', () => {
    expect(pdfDicts.cs.totals.subtotal).toBe('Základ daně');
    expect(pdfDicts.cs.totals.vat).toBe('DPH celkem');
    expect(pdfDicts.cs.totals.total).toBe('Celkem k úhradě');
  });
});

describe('renderInvoicePdf', () => {
  it.each(['sk', 'en', 'cs'] as const)('renders %s PDF without throwing', async (loc) => {
    const buf = await renderInvoicePdf(fixture, loc);
    expect(buf.length).toBeGreaterThan(2000);
  }, 30_000);

  it('defaults to sk when no locale is given', async () => {
    const buf = await renderInvoicePdf(fixture);
    expect(buf.length).toBeGreaterThan(2000);
  }, 30_000);
});
