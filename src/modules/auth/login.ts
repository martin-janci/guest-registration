import { prisma } from '@/db/client';
import { hashPassword, verifyPassword } from './password';
import { createSession, generateSessionToken } from './session';

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; userId: number }
  | { ok: false; reason: 'invalid_credentials' };

// Dummy hash to equalize timing when user is missing.
const DUMMY_HASH = await hashPassword('dummy-password-for-timing-only');

export async function login(username: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { username, deletedAt: null },
  });
  const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
  const ok = await verifyPassword(hashToCheck, password);
  if (!user || !ok) return { ok: false, reason: 'invalid_credentials' };

  const token = generateSessionToken();
  const session = await createSession(token, user.id);
  return { ok: true, token, expiresAt: session.expiresAt, userId: user.id };
}
