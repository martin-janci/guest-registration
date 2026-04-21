import type { Prisma, Invoice, InvoiceItem, User, Registration, Trip, Property } from '@prisma/client';
import { prisma } from '@/db/client';
import { computeItemTotals, sumInvoiceTotals } from '@/lib/money';
import {
  createInvoiceSchema,
  updateInvoiceHeaderSchema,
  itemSchema,
  invoiceFiltersSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceHeaderInput,
  type ItemInput,
  type InvoiceFilters,
} from './schema';

export type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  admin: Pick<User, 'id' | 'username' | 'email'>;
  registration:
    | (Registration & {
        trip: Trip & { property: Pick<Property, 'id' | 'name'> };
      })
    | null;
};

export async function nextInvoiceNumber(adminId: number, year: number): Promise<string> {
  const prefix = `${year}-`;
  const existing = await prisma.invoice.findMany({
    where: { adminId, invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });
  let max = 0;
  for (const row of existing) {
    const tail = row.invoiceNumber.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const next = (max + 1).toString().padStart(4, '0');
  return `${prefix}${next}`;
}

export async function listInvoices(
  adminId: number,
  filters: InvoiceFilters = {},
): Promise<InvoiceWithRelations[]> {
  const parsed = invoiceFiltersSchema.parse(filters);
  const where: Prisma.InvoiceWhereInput = { adminId };
  if (parsed.status) where.status = parsed.status;
  return prisma.invoice.findMany({
    where,
    include: {
      items: { orderBy: [{ position: 'asc' }, { id: 'asc' }] },
      admin: { select: { id: true, username: true, email: true } },
      registration: {
        include: {
          trip: { include: { property: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
  });
}

export async function getInvoiceById(id: number): Promise<InvoiceWithRelations | null> {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ position: 'asc' }, { id: 'asc' }] },
      admin: { select: { id: true, username: true, email: true } },
      registration: {
        include: {
          trip: { include: { property: { select: { id: true, name: true } } } },
        },
      },
    },
  });
}

export async function createInvoice(
  adminId: number,
  input: CreateInvoiceInput,
): Promise<Invoice> {
  const data = createInvoiceSchema.parse(input);
  const year = data.issueDate.getUTCFullYear();
  const invoiceNumber = await nextInvoiceNumber(adminId, year);
  return prisma.invoice.create({
    data: {
      adminId,
      invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail ?? null,
      clientVatNumber: data.clientVatNumber ?? null,
      clientAddress: data.clientAddress ?? null,
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
      currency: data.currency,
      notes: data.notes ?? null,
      registrationId: data.registrationId ?? null,
    },
  });
}

export async function updateInvoiceHeader(
  id: number,
  input: UpdateInvoiceHeaderInput,
): Promise<Invoice> {
  const data = updateInvoiceHeaderSchema.parse(input);
  return prisma.invoice.update({
    where: { id },
    data: {
      clientName: data.clientName,
      clientEmail: data.clientEmail ?? null,
      clientVatNumber: data.clientVatNumber ?? null,
      clientAddress: data.clientAddress ?? null,
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
      currency: data.currency,
      notes: data.notes ?? null,
    },
  });
}

export async function deleteInvoice(id: number): Promise<void> {
  await prisma.invoice.delete({ where: { id } });
}

async function recomputeInvoiceTotals(invoiceId: number): Promise<void> {
  const items = await prisma.invoiceItem.findMany({
    where: { invoiceId },
    select: { lineTotal: true, vatAmount: true, totalWithVat: true },
  });
  const totals = sumInvoiceTotals(
    items.map((i) => ({
      lineTotal: i.lineTotal.toFixed(2),
      vatAmount: i.vatAmount.toFixed(2),
      totalWithVat: i.totalWithVat.toFixed(2),
    })),
  );
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotal: totals.subtotal,
      vatTotal: totals.vatTotal,
      totalAmount: totals.totalAmount,
    },
  });
}

export async function addItem(invoiceId: number, input: ItemInput): Promise<InvoiceItem> {
  const data = itemSchema.parse(input);
  const totals = computeItemTotals(data);
  const maxPos = await prisma.invoiceItem.aggregate({
    where: { invoiceId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;
  const created = await prisma.invoiceItem.create({
    data: {
      invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      vatRate: data.vatRate,
      lineTotal: totals.lineTotal,
      vatAmount: totals.vatAmount,
      totalWithVat: totals.totalWithVat,
      position,
    },
  });
  await recomputeInvoiceTotals(invoiceId);
  return created;
}

export async function updateItem(itemId: number, input: ItemInput): Promise<InvoiceItem> {
  const data = itemSchema.parse(input);
  const totals = computeItemTotals(data);
  const existing = await prisma.invoiceItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { invoiceId: true },
  });
  const updated = await prisma.invoiceItem.update({
    where: { id: itemId },
    data: {
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      vatRate: data.vatRate,
      lineTotal: totals.lineTotal,
      vatAmount: totals.vatAmount,
      totalWithVat: totals.totalWithVat,
    },
  });
  await recomputeInvoiceTotals(existing.invoiceId);
  return updated;
}

export async function deleteItem(itemId: number): Promise<void> {
  const existing = await prisma.invoiceItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { invoiceId: true },
  });
  await prisma.invoiceItem.delete({ where: { id: itemId } });
  await recomputeInvoiceTotals(existing.invoiceId);
}

export async function markSent(id: number): Promise<Invoice> {
  return prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date() },
  });
}

export async function markPaid(id: number): Promise<Invoice> {
  return prisma.invoice.update({
    where: { id },
    data: { status: 'PAID', paidAt: new Date() },
  });
}

export async function countOverdueForAdmin(adminId: number, today = new Date()): Promise<number> {
  const t = new Date(today);
  t.setUTCHours(0, 0, 0, 0);
  return prisma.invoice.count({
    where: {
      adminId,
      OR: [
        { status: 'OVERDUE' },
        { status: 'SENT', dueDate: { lt: t } },
      ],
    },
  });
}
