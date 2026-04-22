'use server';

import { redirect } from '@/lib/i18n/link';
import { z } from 'zod';
import { login } from '@/modules/auth/login';
import { setSessionCookie } from '@/modules/auth/session';
import { prisma } from '@/db/client';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = schema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Fill in username and password.' };

  const result = await login(parsed.data.username, parsed.data.password);
  if (!result.ok) return { error: 'Invalid credentials.' };

  await setSessionCookie(result.token, result.expiresAt);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: result.userId },
    select: { role: true },
  });
  if (user.role === 'HOUSEKEEPER') {
    return await redirect('/housekeeper/dashboard');
  }
  return await redirect('/admin/dashboard');
}
