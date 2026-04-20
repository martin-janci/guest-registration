import { describe, it, expect } from 'vitest';
import { createPropertySchema, updatePropertySchema } from '@/modules/properties/schema';

describe('properties schemas', () => {
  it('createPropertySchema requires name and ownerId', () => {
    expect(createPropertySchema.safeParse({ name: '' }).success).toBe(false);
    expect(createPropertySchema.safeParse({ name: 'ok', ownerId: 1 }).success).toBe(true);
  });

  it('createPropertySchema coerces ownerId and maxGuests from string', () => {
    const r = createPropertySchema.parse({ name: 'ok', ownerId: '42', maxGuests: '6' });
    expect(r.ownerId).toBe(42);
    expect(r.maxGuests).toBe(6);
  });

  it('updatePropertySchema allows omitting maxGuests', () => {
    const r = updatePropertySchema.parse({ name: 'ok' });
    expect(r.maxGuests).toBeUndefined();
  });
});
