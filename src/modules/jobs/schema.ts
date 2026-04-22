import { z } from 'zod';

export const jobKindSchema = z.enum(['AIRBNB_SYNC', 'INVOICE_OVERDUE_FLIP']);
export const jobStatusSchema = z.enum(['PENDING', 'RUNNING', 'DONE', 'FAILED']);

export const airbnbSyncPayloadSchema = z.object({
  calendarId: z.coerce.number().int().positive(),
});
export type AirbnbSyncPayload = z.infer<typeof airbnbSyncPayloadSchema>;

export const invoiceOverdueFlipPayloadSchema = z.object({}).strict();
export type InvoiceOverdueFlipPayload = z.infer<typeof invoiceOverdueFlipPayloadSchema>;

export const enqueueInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('AIRBNB_SYNC'), payload: airbnbSyncPayloadSchema, runAfter: z.date().optional() }),
  z.object({ kind: z.literal('INVOICE_OVERDUE_FLIP'), payload: invoiceOverdueFlipPayloadSchema.default({}), runAfter: z.date().optional() }),
]);
export type EnqueueInput = z.infer<typeof enqueueInputSchema>;

export const jobFiltersSchema = z.object({
  status: jobStatusSchema.optional(),
  kind: jobKindSchema.optional(),
});
export type JobFilters = z.infer<typeof jobFiltersSchema>;

/** Retry backoff: attempt 1 → 1 min, attempt 2 → 5 min, attempt 3+ → give up (status stays FAILED). */
export const MAX_ATTEMPTS = 3;
export function nextRunAfter(attempts: number): Date | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  const delayMs = attempts === 1 ? 60_000 : 5 * 60_000;
  return new Date(Date.now() + delayMs);
}
