import { describe, it, expect } from 'vitest';
import { assignSchema } from '@/modules/property-housekeepers/schema';

describe('property-housekeepers schema', () => {
  it('coerces numeric strings', () => {
    const r = assignSchema.parse({ propertyId: '1', housekeeperId: '2' });
    expect(r.propertyId).toBe(1);
    expect(r.housekeeperId).toBe(2);
  });

  it('accepts payOverride like "22.50"', () => {
    const r = assignSchema.parse({ propertyId: 1, housekeeperId: 2, payOverride: '22.50' });
    expect(r.payOverride).toBe('22.50');
  });

  it('rejects malformed payOverride', () => {
    expect(
      assignSchema.safeParse({ propertyId: 1, housekeeperId: 2, payOverride: 'abc' }).success,
    ).toBe(false);
  });

  it('treats empty payOverride as undefined', () => {
    const r = assignSchema.parse({ propertyId: 1, housekeeperId: 2, payOverride: '' });
    expect(r.payOverride).toBeUndefined();
  });
});
