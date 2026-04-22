import { describe, it, expect } from 'vitest';
import { invoiceSentTemplate } from '@/modules/email/templates/invoice-sent';

describe('invoiceSentTemplate', () => {
  it('includes invoice number, total, and sender', () => {
    const t = invoiceSentTemplate({
      clientName: 'Acme',
      invoiceNumber: '2026-0001',
      propertyName: 'Tatranská Perla',
      totalDisplay: '300,00 €',
      dueDateDisplay: '2026-05-24',
      senderName: 'Martin Janči',
      locale: 'en',
    });
    expect(t.subject).toContain('2026-0001');
    expect(t.html).toContain('300,00 €');
    expect(t.html).toContain('Tatranská Perla');
    expect(t.text).toContain('Martin Janči');
  });

  it('omits property line when propertyName is null', () => {
    const t = invoiceSentTemplate({
      clientName: 'Acme',
      invoiceNumber: '2026-0002',
      propertyName: null,
      totalDisplay: '50,00 €',
      dueDateDisplay: null,
      senderName: 'Host',
      locale: 'en',
    });
    expect(t.html).not.toContain('Related stay');
    expect(t.html).not.toContain('Due:');
  });

  it('uses Slovak strings when locale is sk', () => {
    const t = invoiceSentTemplate({
      clientName: 'Acme',
      invoiceNumber: '2026-0003',
      propertyName: null,
      totalDisplay: '100,00 €',
      dueDateDisplay: '2026-06-01',
      senderName: 'Martin Janči',
      locale: 'sk',
    });
    expect(t.subject).toContain('Faktúra');
    expect(t.html).toContain('Splatnosť');
    expect(t.text).toContain('S pozdravom');
  });

  it('uses Czech strings when locale is cs', () => {
    const t = invoiceSentTemplate({
      clientName: 'Acme',
      invoiceNumber: '2026-0004',
      propertyName: null,
      totalDisplay: '200,00 €',
      dueDateDisplay: null,
      senderName: 'Martin',
      locale: 'cs',
    });
    expect(t.subject).toContain('Faktura');
    expect(t.text).toContain('Děkujeme');
  });

  it('uses default locale (sk) when locale is omitted', () => {
    const t = invoiceSentTemplate({
      clientName: 'Acme',
      invoiceNumber: '2026-0005',
      propertyName: null,
      totalDisplay: '150,00 €',
      dueDateDisplay: null,
      senderName: 'Martin',
    });
    expect(t.subject).toContain('Faktúra');
  });
});
