import { describe, it, expect } from 'vitest';
import { createTripSchema, updateTripSchema, tripFiltersSchema } from '@/modules/trips/schema';

describe('trips schemas', () => {
  it('createTripSchema rejects when end <= start', () => {
    const r = createTripSchema.safeParse({
      title: 'x',
      propertyId: 1,
      startDate: '2026-05-10',
      endDate: '2026-05-10',
      maxGuests: 2,
    });
    expect(r.success).toBe(false);
  });

  it('createTripSchema accepts valid input', () => {
    const r = createTripSchema.parse({
      title: 'Anna',
      propertyId: 1,
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      maxGuests: 2,
    });
    expect(r.startDate.toISOString().slice(0, 10)).toBe('2026-05-10');
  });

  it('updateTripSchema enforces the same ordering rule', () => {
    expect(
      updateTripSchema.safeParse({
        title: 'x',
        startDate: '2026-05-10',
        endDate: '2026-05-09',
        maxGuests: 2,
      }).success,
    ).toBe(false);
  });

  it('tripFiltersSchema coerces includePast and optional dates', () => {
    const r = tripFiltersSchema.parse({ includePast: 'true', from: '2026-05-01' });
    expect(r.includePast).toBe(true);
    expect(r.from?.toISOString().slice(0, 10)).toBe('2026-05-01');
  });
});
