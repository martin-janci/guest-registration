import { z } from 'zod';

export const createCalendarSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  icsUrl: z.string().trim().url().max(2000),
  syncIntervalMin: z.coerce.number().int().min(5).max(1440).default(60),
});
export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

export const updateCalendarSchema = z.object({
  name: z.string().trim().min(1).max(200),
  icsUrl: z.string().trim().url().max(2000),
  syncIntervalMin: z.coerce.number().int().min(5).max(1440),
});
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;
