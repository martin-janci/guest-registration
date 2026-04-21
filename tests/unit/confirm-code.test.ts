import { describe, it, expect } from 'vitest';
import { generateConfirmCode } from '@/lib/confirm-code';

describe('generateConfirmCode', () => {
  it('returns 10 chars by default', () => {
    expect(generateConfirmCode()).toHaveLength(10);
  });

  it('uses URL-safe alphabet (no ambiguous chars)', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateConfirmCode()).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it('is non-deterministic', () => {
    const set = new Set(Array.from({ length: 200 }, () => generateConfirmCode()));
    expect(set.size).toBe(200);
  });

  it('accepts a custom length', () => {
    expect(generateConfirmCode(20)).toHaveLength(20);
  });
});
