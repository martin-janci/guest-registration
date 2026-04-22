'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from '@/lib/i18n/link';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import { createUser } from '@/modules/users/service';
import { createUserSchema } from '@/modules/users/schema';

export type CreateUserState = { error?: string; fieldErrors?: Record<string, string> };

export async function createUserAction(
  _prev: CreateUserState | undefined,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
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
    await createUser(parsed.data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? 'field';
      return { error: `A user with this ${target} already exists.` };
    }
    throw err;
  }

  revalidatePath('/admin/users');
  return redirect('/admin/users');
}
