import { describe, it, expect } from 'vitest';
import { computeItemTotals, sumInvoiceTotals, formatMoney } from '@/lib/money';

describe('computeItemTotals', () => {
  it('computes line totals and VAT for a whole-unit qty', () => {
    const r = computeItemTotals({ quantity: '2', unitPrice: '100.00', vatRate: '20' });
    expect(r.lineTotal).toBe('200.00');
    expect(r.vatAmount).toBe('40.00');
    expect(r.totalWithVat).toBe('240.00');
  });

  it('handles fractional quantities precisely', () => {
    const r = computeItemTotals({ quantity: '1.5', unitPrice: '19.99', vatRate: '10' });
    expect(r.lineTotal).toBe('29.99'); // 1.5 * 19.99 = 29.985 -> ROUND_HALF_UP -> 29.99
    expect(r.vatAmount).toBe('3.00');
    expect(r.totalWithVat).toBe('32.99');
  });

  it('zero VAT rate yields zero vatAmount', () => {
    const r = computeItemTotals({ quantity: '1', unitPrice: '50.00', vatRate: '0' });
    expect(r.vatAmount).toBe('0.00');
    expect(r.totalWithVat).toBe('50.00');
  });

  it('rejects negative inputs', () => {
    expect(() => computeItemTotals({ quantity: '-1', unitPrice: '10', vatRate: '0' })).toThrow();
    expect(() => computeItemTotals({ quantity: '1', unitPrice: '-10', vatRate: '0' })).toThrow();
    expect(() => computeItemTotals({ quantity: '1', unitPrice: '10', vatRate: '-5' })).toThrow();
  });
});

describe('sumInvoiceTotals', () => {
  it('sums subtotal, vat, and total across items', () => {
    const r = sumInvoiceTotals([
      { lineTotal: '100.00', vatAmount: '20.00', totalWithVat: '120.00' },
      { lineTotal: '50.00', vatAmount: '5.00', totalWithVat: '55.00' },
    ]);
    expect(r.subtotal).toBe('150.00');
    expect(r.vatTotal).toBe('25.00');
    expect(r.totalAmount).toBe('175.00');
  });

  it('returns zeros for empty items', () => {
    const r = sumInvoiceTotals([]);
    expect(r.subtotal).toBe('0.00');
    expect(r.vatTotal).toBe('0.00');
    expect(r.totalAmount).toBe('0.00');
  });
});

describe('formatMoney', () => {
  it('formats EUR with 2 decimals', () => {
    expect(formatMoney('1234.5', 'EUR')).toBe('1 234,50 €');
  });

  it('formats USD for fallback currencies', () => {
    expect(formatMoney('99', 'USD')).toBe('99,00 USD');
  });
});
