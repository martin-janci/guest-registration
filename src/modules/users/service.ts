import type { User } from '@prisma/client';
import { prisma } from '@/db/client';
import { hashPassword } from '@/modules/auth/password';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
} from './schema';

export type PublicUser = Omit<User, 'passwordHash'>;

function redact(user: User): PublicUser {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

export async function listUsers({
  includeDeleted = false,
}: { includeDeleted?: boolean } = {}): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: [{ deletedAt: 'asc' }, { username: 'asc' }],
  });
  return rows.map(redact);
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? redact(row) : null;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const data = createUserSchema.parse(input);
  const row = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      role: data.role,
      passwordHash: await hashPassword(data.password),
    },
  });
  return redact(row);
}

export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<PublicUser> {
  const data = updateUserSchema.parse(input);
  const row = await prisma.user.update({ where: { id }, data });
  return redact(row);
}

export async function softDeleteUser(id: number): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  // Also invalidate all active sessions so the user is immediately logged out everywhere.
  await prisma.session.deleteMany({ where: { userId: id } });
  return redact(row);
}

export async function restoreUser(id: number): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id },
    data: { deletedAt: null },
  });
  return redact(row);
}

export async function resetUserPassword(
  id: number,
  input: ResetPasswordInput,
): Promise<PublicUser> {
  const data = resetPasswordSchema.parse(input);
  const row = await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  // Invalidate existing sessions — user must re-login with the new password.
  await prisma.session.deleteMany({ where: { userId: id } });
  return redact(row);
}
