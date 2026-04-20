import { z } from 'zod';

export const userRoleSchema = z.enum(['SUPERADMIN', 'ADMIN', 'HOUSEKEEPER']);

export const createUserSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(200),
  role: userRoleSchema.default('ADMIN'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(120),
  role: userRoleSchema,
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
