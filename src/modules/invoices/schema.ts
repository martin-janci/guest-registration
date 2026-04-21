import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']);

const dateFromInput = z
  .union([
    z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').transform((s) => new Date(`${s}T00:00:00Z`)),
    z.date(),
  ]);

const optionalDateFromInput = dateFromInput.optional();

const decimalString = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Expected a non-negative number with up to 2 decimals');

export const createInvoiceSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  clientEmail: z.string().trim().email().max(200).optional(),
  clientVatNumber: z.string().trim().max(50).optional(),
  clientAddress: z.string().trim().max(500).optional(),
  issueDate: dateFromInput,
  dueDate: optionalDateFromInput,
  currency: z.string().trim().length(3).default('EUR'),
  notes: z.string().trim().max(2000).optional(),
  registrationId: z.coerce.number().int().positive().optional(),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceHeaderSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  clientEmail: z.string().trim().email().max(200).optional(),
  clientVatNumber: z.string().trim().max(50).optional(),
  clientAddress: z.string().trim().max(500).optional(),
  issueDate: dateFromInput,
  dueDate: optionalDateFromInput,
  currency: z.string().trim().length(3),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdateInvoiceHeaderInput = z.infer<typeof updateInvoiceHeaderSchema>;

export const itemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: decimalString,
  unitPrice: decimalString,
  vatRate: decimalString,
});
export type ItemInput = z.infer<typeof itemSchema>;

export const invoiceFiltersSchema = z.object({
  status: invoiceStatusSchema.optional(),
});
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
