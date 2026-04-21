import { z } from 'zod';

export const ageCategorySchema = z.enum(['ADULT', 'CHILD']);
export const documentTypeSchema = z.enum(['PASSPORT', 'DRIVING_LICENSE', 'CITIZEN_ID']);
export const registrationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const submitGuestSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  ageCategory: ageCategorySchema,
  documentType: documentTypeSchema,
  documentNumber: z.string().trim().min(1).max(100),
  gdprConsent: z.coerce.boolean().refine((v) => v === true, {
    message: 'GDPR consent required',
  }),
});
export type SubmitGuestInput = z.infer<typeof submitGuestSchema>;

export const submitRegistrationSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  email: z.string().trim().email().max(200),
  guests: z.array(submitGuestSchema).min(1).max(20),
});
export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>;

export const registrationFiltersSchema = z.object({
  status: registrationStatusSchema.optional(),
  tripId: z.coerce.number().int().positive().optional(),
});
export type RegistrationFilters = z.infer<typeof registrationFiltersSchema>;
