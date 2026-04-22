import type { Locale } from './locales';

export interface PdfDict {
  title: string;
  issuer: string;
  client: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  deliveryDate: string;
  item: { description: string; quantity: string; unitPrice: string; vatRate: string; lineTotal: string };
  totals: { subtotal: string; vat: string; total: string };
  notes: string;
  paymentInstructions: string;
}

export const pdfDicts: Record<Locale, PdfDict> = {
  sk: {
    title: 'Faktúra',
    issuer: 'Dodávateľ',
    client: 'Odberateľ',
    invoiceNumber: 'Číslo faktúry',
    issueDate: 'Dátum vystavenia',
    dueDate: 'Dátum splatnosti',
    deliveryDate: 'Dátum dodania',
    item: {
      description: 'Popis',
      quantity: 'Množstvo',
      unitPrice: 'Jedn. cena',
      vatRate: 'DPH',
      lineTotal: 'Spolu',
    },
    totals: { subtotal: 'Základ dane', vat: 'DPH spolu', total: 'Celkom k úhrade' },
    notes: 'Poznámka',
    paymentInstructions: 'Platobné údaje',
  },
  en: {
    title: 'Invoice',
    issuer: 'Seller',
    client: 'Bill to',
    invoiceNumber: 'Invoice number',
    issueDate: 'Issue date',
    dueDate: 'Due date',
    deliveryDate: 'Delivery date',
    item: {
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      vatRate: 'VAT',
      lineTotal: 'Total',
    },
    totals: { subtotal: 'Subtotal', vat: 'VAT', total: 'Total due' },
    notes: 'Notes',
    paymentInstructions: 'Payment details',
  },
  cs: {
    title: 'Faktura',
    issuer: 'Dodavatel',
    client: 'Odběratel',
    invoiceNumber: 'Číslo faktury',
    issueDate: 'Datum vystavení',
    dueDate: 'Datum splatnosti',
    deliveryDate: 'Datum dodání',
    item: {
      description: 'Popis',
      quantity: 'Množství',
      unitPrice: 'Jedn. cena',
      vatRate: 'DPH',
      lineTotal: 'Celkem',
    },
    totals: { subtotal: 'Základ daně', vat: 'DPH celkem', total: 'Celkem k úhradě' },
    notes: 'Poznámka',
    paymentInstructions: 'Platební údaje',
  },
};
