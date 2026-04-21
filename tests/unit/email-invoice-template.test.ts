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
    });
    expect(t.html).not.toContain('Related stay');
    expect(t.html).not.toContain('Due:');
  });
});
