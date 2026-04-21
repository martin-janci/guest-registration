import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

type D = InstanceType<typeof Decimal>;

function asNonNegativeDecimal(s: string, label: string): D {
  let d: D;
  try {
    d = new Decimal(s);
  } catch {
    throw new Error(`${label} is not a valid number: ${s}`);
  }
  if (d.isNegative()) {
    throw new Error(`${label} cannot be negative`);
  }
  return d;
}

export interface ItemTotalsInput {
  quantity: string;
  unitPrice: string;
  vatRate: string; // percent, e.g. "20" for 20%
}

export interface ItemTotals {
  lineTotal: string;
  vatAmount: string;
  totalWithVat: string;
}

export function computeItemTotals(input: ItemTotalsInput): ItemTotals {
  const q = asNonNegativeDecimal(input.quantity, 'quantity');
  const p = asNonNegativeDecimal(input.unitPrice, 'unit price');
  const rate = asNonNegativeDecimal(input.vatRate, 'VAT rate');

  const lineTotal = q.mul(p);
  const roundedLine = lineTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const vatAmount = roundedLine.mul(rate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalWithVat = roundedLine.plus(vatAmount);

  return {
    lineTotal: roundedLine.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalWithVat: totalWithVat.toFixed(2),
  };
}

export interface InvoiceTotals {
  subtotal: string;
  vatTotal: string;
  totalAmount: string;
}

export function sumInvoiceTotals(items: ItemTotals[]): InvoiceTotals {
  let subtotal = new Decimal(0);
  let vatTotal = new Decimal(0);
  let totalAmount = new Decimal(0);
  for (const it of items) {
    subtotal = subtotal.plus(it.lineTotal);
    vatTotal = vatTotal.plus(it.vatAmount);
    totalAmount = totalAmount.plus(it.totalWithVat);
  }
  return {
    subtotal: subtotal.toFixed(2),
    vatTotal: vatTotal.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}

export function formatMoney(value: string | D, currency: string): string {
  const d = typeof value === 'string' ? new Decimal(value) : value;
  const fixed = d.toFixed(2).replace('.', ',');
  const [int, frac] = fixed.split(',');
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formatted = `${grouped},${frac}`;
  if (currency === 'EUR') return `${formatted} €`;
  return `${formatted} ${currency}`;
}
