import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().trim().min(1).max(200),
  ownerId: z.coerce.number().int().positive(),
  maxGuests: z.coerce.number().int().positive().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z.object({
  name: z.string().trim().min(1).max(200),
  maxGuests: z.coerce.number().int().positive().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
