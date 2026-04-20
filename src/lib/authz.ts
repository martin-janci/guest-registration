import type { User } from '@prisma/client';
import { getCurrentSession } from '@/modules/auth/current';

export class AuthError extends Error {
  constructor(public readonly reason: 'unauthenticated' | 'forbidden') {
    super(reason);
    this.name = 'AuthError';
  }
}

/** Require an authenticated admin (ADMIN or SUPERADMIN). Throws AuthError otherwise. */
export async function requireAdmin(): Promise<User> {
  const { user } = await getCurrentSession();
  if (!user) throw new AuthError('unauthenticated');
  if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    throw new AuthError('forbidden');
  }
  return user as User;
}
