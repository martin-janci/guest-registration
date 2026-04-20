import { prisma } from '@/db/client';
import { hashPassword, verifyPassword } from '@/modules/auth/password';
import {
  profileSchema,
  passwordChangeSchema,
  type ProfileInput,
  type PasswordChangeInput,
} from './schema';

export async function getMyProfile(userId: number) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      companyName: true,
      companyIco: true,
      companyVat: true,
      contactName: true,
      contactPhone: true,
      contactAddress: true,
      contactWebsite: true,
      contactDescription: true,
      customLine1: true,
      customLine2: true,
      customLine3: true,
      photoRequiredAdults: true,
      photoRequiredChildren: true,
      dateFormat: true,
      defaultHousekeeperPay: true,
    },
  });
}

const nullableStringFields = [
  'companyName', 'companyIco', 'companyVat',
  'contactName', 'contactPhone', 'contactAddress', 'contactWebsite', 'contactDescription',
  'customLine1', 'customLine2', 'customLine3',
] as const;

export async function updateMyProfile(userId: number, input: ProfileInput) {
  const parsed = profileSchema.parse(input);
  // exactOptionalPropertyTypes: Prisma nullable columns need null (clear) not undefined (skip).
  const data: Record<string, unknown> = { ...parsed };
  for (const f of nullableStringFields) {
    if (!(f in parsed) || parsed[f] === undefined) data[f] = null;
  }
  await prisma.user.update({ where: { id: userId }, data });
}

export type PasswordChangeResult = { ok: true } | { ok: false; reason: 'bad_current' };

export async function changeMyPassword(
  userId: number,
  input: PasswordChangeInput,
): Promise<PasswordChangeResult> {
  const data = passwordChangeSchema.parse(input);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await verifyPassword(user.passwordHash, data.currentPassword);
  if (!ok) return { ok: false, reason: 'bad_current' };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  return { ok: true };
}
