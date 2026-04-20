import { describe, it, expect } from 'vitest';
import { generateRandomPassword } from '@/lib/password-gen';

describe('generateRandomPassword', () => {
  it('returns a string of the requested length', () => {
    expect(generateRandomPassword(12).length).toBe(12);
    expect(generateRandomPassword(20).length).toBe(20);
  });

  it('uses a URL-safe alphabet only (no ambiguous chars)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRandomPassword(16)).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it('is non-deterministic', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateRandomPassword(16)));
    expect(set.size).toBe(100);
  });
});
