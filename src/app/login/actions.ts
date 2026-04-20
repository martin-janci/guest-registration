'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { login } from '@/modules/auth/login';
import { setSessionCookie } from '@/modules/auth/session';

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
  redirect('/admin/dashboard');
}
