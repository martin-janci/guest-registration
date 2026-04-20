import { z } from 'zod';

export const assignSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  housekeeperId: z.coerce.number().int().positive(),
  isDefault: z.coerce.boolean().optional(),
  payOverride: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/).optional())
    .optional(),
});
export type AssignInput = z.infer<typeof assignSchema>;
