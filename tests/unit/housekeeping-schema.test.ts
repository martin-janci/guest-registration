import { describe, it, expect } from 'vitest';
import { createTaskSchema, reassignSchema, taskFiltersSchema } from '@/modules/housekeeping/schema';

describe('housekeeping schemas', () => {
  it('createTaskSchema accepts a valid payload', () => {
    const r = createTaskSchema.parse({
      tripId: 1, housekeeperId: 2, date: '2026-05-12', payAmount: '25.00',
    });
    expect(r.tripId).toBe(1);
    expect(r.date.toISOString().slice(0, 10)).toBe('2026-05-12');
  });

  it('createTaskSchema rejects bad pay format', () => {
    expect(createTaskSchema.safeParse({
      tripId: 1, housekeeperId: 2, date: '2026-05-12', payAmount: 'free',
    }).success).toBe(false);
  });

  it('reassignSchema allows omitting payAmount', () => {
    expect(reassignSchema.parse({ housekeeperId: 3 }).payAmount).toBeUndefined();
  });

  it('taskFiltersSchema coerces unpaidOnly and dates', () => {
    const r = taskFiltersSchema.parse({ unpaidOnly: 'true', from: '2026-05-01' });
    expect(r.unpaidOnly).toBe(true);
    expect(r.from?.toISOString().slice(0, 10)).toBe('2026-05-01');
  });
});
