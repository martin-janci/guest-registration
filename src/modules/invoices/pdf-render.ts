import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InvoiceDocument, type InvoicePdfData } from './pdf';

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(React.createElement(InvoiceDocument, { data }));
}
