import { z } from 'zod';

const maxLen = (n: number) => z.string().trim().max(n).optional().transform((v) => (v === '' ? undefined : v));

export const profileSchema = z.object({
  companyName: maxLen(200),
  companyIco: maxLen(50),
  companyVat: maxLen(50),
  contactName: maxLen(200),
  contactPhone: maxLen(50),
  contactAddress: maxLen(500),
  contactWebsite: maxLen(200),
  contactDescription: maxLen(2000),
  customLine1: maxLen(200),
  customLine2: maxLen(200),
  customLine3: maxLen(200),
  photoRequiredAdults: z.union([z.boolean(), z.enum(['true', 'false', 'on', 'off']).transform((v) => v === 'true' || v === 'on')]),
  photoRequiredChildren: z.union([z.boolean(), z.enum(['true', 'false', 'on', 'off']).transform((v) => v === 'true' || v === 'on')]),
  dateFormat: z.enum(['d.M.y', 'd.M.yyyy', 'yyyy-MM-dd', 'M/d/yyyy']).default('d.M.y'),
  defaultHousekeeperPay: z.string().regex(/^\d+(\.\d{1,2})?$/),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
