import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/modules/auth/current', () => ({
  getCurrentSession: vi.fn(),
}));

import { requireAdmin, AuthError } from '@/lib/authz';
import { getCurrentSession } from '@/modules/auth/current';

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the user when role is ADMIN', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 1, username: 'a', email: 'a@x', role: 'ADMIN' } as never,
      session: { id: 's', userId: 1, expiresAt: new Date() } as never,
    });
    const u = await requireAdmin();
    expect(u.role).toBe('ADMIN');
  });

  it('returns the user when role is SUPERADMIN', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 1, username: 'a', email: 'a@x', role: 'SUPERADMIN' } as never,
      session: { id: 's', userId: 1, expiresAt: new Date() } as never,
    });
    const u = await requireAdmin();
    expect(u.role).toBe('SUPERADMIN');
  });

  it('throws AuthError when no session', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: null, session: null });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
  });

  it('throws AuthError when role is HOUSEKEEPER', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: 9, username: 'h', email: 'h@x', role: 'HOUSEKEEPER' } as never,
      session: { id: 's', userId: 9, expiresAt: new Date() } as never,
    });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthError);
  });
});
