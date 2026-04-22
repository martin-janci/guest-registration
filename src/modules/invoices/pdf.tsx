import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatMoney } from '@/lib/money';
import type { PdfDict } from '@/lib/i18n/pdf-dict';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: '#1a1a1a', fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: 20, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  h2: { fontSize: 12, marginTop: 16, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  block: { marginBottom: 6, lineHeight: 1.4 },
  muted: { color: '#666' },
  table: { marginTop: 8, borderTopWidth: 0.5, borderColor: '#ccc' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ccc' },
  th: { padding: 6, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#555' },
  td: { padding: 6, fontSize: 10 },
  col_desc: { flex: 3 },
  col_num: { flex: 1, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 12 },
  totalLabel: { width: 120, textAlign: 'right', color: '#555' },
  totalValue: { width: 100, textAlign: 'right' },
  grand: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
});

export interface InvoicePdfItem {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  lineTotal: string;
  totalWithVat: string;
}

export interface InvoicePdfBrand {
  companyName: string | null;
  companyIco: string | null;
  companyVat: string | null;
  contactName: string | null;
  contactAddress: string | null;
  contactPhone: string | null;
  contactWebsite: string | null;
  customLine1: string | null;
  customLine2: string | null;
  customLine3: string | null;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  clientName: string;
  clientEmail: string | null;
  clientVatNumber: string | null;
  clientAddress: string | null;
  items: InvoicePdfItem[];
  subtotal: string;
  vatTotal: string;
  totalAmount: string;
  notes: string | null;
  brand: InvoicePdfBrand;
}

export function InvoiceDocument({ data, dict }: { data: InvoicePdfData; dict: PdfDict }) {
  const b = data.brand;
  const customLines = [b.customLine1, b.customLine2, b.customLine3].filter((l): l is string => !!l);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View>
            <Text style={styles.h1}>{dict.title} {data.invoiceNumber}</Text>
            <Text style={styles.block}>{dict.issueDate}: {data.issueDate}</Text>
            {data.dueDate && <Text style={styles.block}>{dict.dueDate}: {data.dueDate}</Text>}
          </View>
          <View>
            {b.companyName && <Text style={styles.h2}>{b.companyName}</Text>}
            {b.contactAddress && <Text style={styles.block}>{b.contactAddress}</Text>}
            {b.companyIco && <Text style={styles.block}>IČO: {b.companyIco}</Text>}
            {b.companyVat && <Text style={styles.block}>VAT: {b.companyVat}</Text>}
            {b.contactPhone && <Text style={styles.block}>{b.contactPhone}</Text>}
            {b.contactWebsite && <Text style={styles.block}>{b.contactWebsite}</Text>}
          </View>
        </View>

        <Text style={styles.h2}>{dict.client}</Text>
        <Text style={styles.block}>{data.clientName}</Text>
        {data.clientAddress && <Text style={styles.block}>{data.clientAddress}</Text>}
        {data.clientVatNumber && <Text style={styles.block}>VAT: {data.clientVatNumber}</Text>}
        {data.clientEmail && <Text style={styles.block}>{data.clientEmail}</Text>}

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, styles.col_desc]}>{dict.item.description}</Text>
            <Text style={[styles.th, styles.col_num]}>{dict.item.quantity}</Text>
            <Text style={[styles.th, styles.col_num]}>{dict.item.unitPrice}</Text>
            <Text style={[styles.th, styles.col_num]}>{dict.item.vatRate}%</Text>
            <Text style={[styles.th, styles.col_num]}>{dict.item.lineTotal}</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tr}>
              <Text style={[styles.td, styles.col_desc]}>{it.description}</Text>
              <Text style={[styles.td, styles.col_num]}>{it.quantity}</Text>
              <Text style={[styles.td, styles.col_num]}>{formatMoney(it.unitPrice, data.currency)}</Text>
              <Text style={[styles.td, styles.col_num]}>{it.vatRate}%</Text>
              <Text style={[styles.td, styles.col_num]}>{formatMoney(it.totalWithVat, data.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{dict.totals.subtotal}</Text>
            <Text style={styles.totalValue}>{formatMoney(data.subtotal, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{dict.totals.vat}</Text>
            <Text style={styles.totalValue}>{formatMoney(data.vatTotal, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grand]}>{dict.totals.total}</Text>
            <Text style={[styles.totalValue, styles.grand]}>{formatMoney(data.totalAmount, data.currency)}</Text>
          </View>
        </View>

        {data.notes && (
          <>
            <Text style={styles.h2}>{dict.notes}</Text>
            <Text style={styles.block}>{data.notes}</Text>
          </>
        )}

        {customLines.length > 0 && (
          <View style={{ marginTop: 20 }}>
            {customLines.map((l, i) => (
              <Text key={i} style={[styles.block, styles.muted]}>{l}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
