import { describe, it, expect } from 'vitest';
import { generateSessionToken, hashSessionToken } from '@/modules/auth/session';

describe('session token', () => {
  it('generates a URL-safe token ~27 chars long', () => {
    const t = generateSessionToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThanOrEqual(26);
  });

  it('produces unique tokens', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateSessionToken()));
    expect(set.size).toBe(100);
  });

  it('hashes deterministically to 64 hex chars', () => {
    expect(hashSessionToken('abc')).toBe(hashSessionToken('abc'));
    expect(hashSessionToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken('abc')).not.toBe(hashSessionToken('abd'));
  });
});
