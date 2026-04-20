'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import { updateUser, resetUserPassword } from '@/modules/users/service';
import { updateUserSchema, resetPasswordSchema } from '@/modules/users/schema';

type BaseState = { error?: string; fieldErrors?: Record<string, string> };

export async function updateUserAction(
  id: number,
  _prev: BaseState | undefined,
  formData: FormData,
): Promise<BaseState> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await updateUser(id, parsed.data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? 'field';
      return { error: `Another user has this ${target}.` };
    }
    throw err;
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}/edit`);
  redirect('/admin/users');
}

export type ResetPasswordState = { error?: string; newPassword?: string };

export async function resetPasswordAction(
  id: number,
  _prev: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireAdmin();

  const newPassword = String(formData.get('newPassword') ?? '');
  const parsed = resetPasswordSchema.safeParse({ newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid password' };
  }
  await resetUserPassword(id, parsed.data);
  return { newPassword: parsed.data.newPassword };
}
