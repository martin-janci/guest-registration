import { cookies } from 'next/headers';
import { cache } from 'react';
import { env } from '@/lib/env';
import { validateSessionToken, type ValidationResult, invalidateSession, clearSessionCookie } from './session';

export const getCurrentSession = cache(async (): Promise<ValidationResult> => {
  const token = (await cookies()).get(env.SESSION_COOKIE_NAME)?.value ?? null;
  if (!token) return { session: null, user: null };
  return validateSessionToken(token);
});

export async function invalidateCurrentSession(): Promise<void> {
  const { session } = await getCurrentSession();
  if (session) await invalidateSession(session.id);
  await clearSessionCookie();
}
