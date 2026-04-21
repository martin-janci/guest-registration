import { z } from 'zod';

export const tripSourceSchema = z.enum(['MANUAL', 'AIRBNB_ICS', 'WEBHOOK']);

const dateFromInput = z.union([
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
    .transform((s) => new Date(`${s}T00:00:00Z`)),
  z.date(),
]);

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    propertyId: z.coerce.number().int().positive(),
    startDate: dateFromInput,
    endDate: dateFromInput,
    maxGuests: z.coerce.number().int().positive().max(100),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startDate: dateFromInput,
    endDate: dateFromInput,
    maxGuests: z.coerce.number().int().positive().max(100),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const tripFiltersSchema = z.object({
  propertyId: z.coerce.number().int().positive().optional(),
  source: tripSourceSchema.optional(),
  from: dateFromInput.optional(),
  to: dateFromInput.optional(),
  includePast: z.coerce.boolean().default(false),
});
export type TripFilters = z.infer<typeof tripFiltersSchema>;
