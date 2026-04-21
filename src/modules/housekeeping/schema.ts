import { z } from 'zod';

export const housekeepingStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);

const dateFromInput = z.union([
  z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').transform((s) => new Date(`${s}T00:00:00Z`)),
  z.date(),
]);

const decimalString = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Expected non-negative money');

export const createTaskSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  housekeeperId: z.coerce.number().int().positive(),
  date: dateFromInput,
  payAmount: decimalString,
  notes: z.string().trim().max(2000).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const reassignSchema = z.object({
  housekeeperId: z.coerce.number().int().positive(),
  payAmount: decimalString.optional(),
});
export type ReassignInput = z.infer<typeof reassignSchema>;

export const taskFiltersSchema = z.object({
  status: housekeepingStatusSchema.optional(),
  housekeeperId: z.coerce.number().int().positive().optional(),
  from: dateFromInput.optional(),
  to: dateFromInput.optional(),
  unpaidOnly: z.coerce.boolean().optional(),
});
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
