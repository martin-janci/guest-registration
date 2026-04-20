import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { Session, User } from '@prisma/client';
import { prisma } from '@/db/client';
import { env } from '@/lib/env';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
const REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // refresh when < 15 days remaining

export function generateSessionToken(): string {
  return crypto.randomBytes(20).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, userId: number): Promise<Session> {
  return prisma.session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
}

export type ValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export async function validateSessionToken(token: string): Promise<ValidationResult> {
  const id = hashSessionToken(token);
  const row = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!row) return { session: null, user: null };

  if (Date.now() >= row.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    return { session: null, user: null };
  }

  // Sliding refresh: extend when less than REFRESH_THRESHOLD_MS remaining.
  if (row.expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await prisma.session.update({ where: { id }, data: { expiresAt: newExpiresAt } });
    row.expiresAt = newExpiresAt;
  }

  const { user, ...session } = row;
  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

// ── Cookie helpers ────────────────────────────────────────────────────────
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.SESSION_COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: env.SESSION_COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
