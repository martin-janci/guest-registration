import { describe, it, expect } from 'vitest';
import { enqueueInputSchema, nextRunAfter, MAX_ATTEMPTS } from '@/modules/jobs/schema';

describe('jobs schemas', () => {
  it('enqueueInputSchema accepts AIRBNB_SYNC with calendarId', () => {
    const r = enqueueInputSchema.parse({ kind: 'AIRBNB_SYNC', payload: { calendarId: 42 } });
    expect(r.kind).toBe('AIRBNB_SYNC');
    if (r.kind !== 'AIRBNB_SYNC') throw new Error('unreachable');
    expect(r.payload.calendarId).toBe(42);
  });

  it('enqueueInputSchema accepts INVOICE_OVERDUE_FLIP with empty payload', () => {
    const r = enqueueInputSchema.parse({ kind: 'INVOICE_OVERDUE_FLIP', payload: {} });
    expect(r.kind).toBe('INVOICE_OVERDUE_FLIP');
  });

  it('enqueueInputSchema rejects AIRBNB_SYNC without calendarId', () => {
    expect(enqueueInputSchema.safeParse({ kind: 'AIRBNB_SYNC', payload: {} }).success).toBe(false);
  });

  it('enqueueInputSchema rejects unknown kind', () => {
    expect(enqueueInputSchema.safeParse({ kind: 'UNKNOWN' as never, payload: {} }).success).toBe(false);
  });
});

describe('nextRunAfter backoff', () => {
  it('returns ~1 min for attempt 1', () => {
    const d = nextRunAfter(1)!;
    const diff = d.getTime() - Date.now();
    expect(diff).toBeGreaterThan(50_000);
    expect(diff).toBeLessThan(70_000);
  });

  it('returns ~5 min for attempt 2', () => {
    const d = nextRunAfter(2)!;
    const diff = d.getTime() - Date.now();
    expect(diff).toBeGreaterThan(4 * 60_000);
    expect(diff).toBeLessThan(6 * 60_000);
  });

  it(`returns null after MAX_ATTEMPTS (${MAX_ATTEMPTS})`, () => {
    expect(nextRunAfter(MAX_ATTEMPTS)).toBeNull();
    expect(nextRunAfter(MAX_ATTEMPTS + 5)).toBeNull();
  });
});
