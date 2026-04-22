import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument, type InvoicePdfData } from './pdf';
import { pdfDicts } from '@/lib/i18n/pdf-dict';
import type { Locale } from '@/lib/i18n/locales';

export async function renderInvoicePdf(data: InvoicePdfData, locale: Locale = 'sk'): Promise<Buffer> {
  const dict = pdfDicts[locale];
  return renderToBuffer(<InvoiceDocument data={data} dict={dict} />);
}
