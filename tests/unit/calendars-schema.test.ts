import { describe, it, expect } from 'vitest';
import { createCalendarSchema, updateCalendarSchema } from '@/modules/calendars/schema';

describe('calendars schemas', () => {
  it('createCalendarSchema requires a URL', () => {
    expect(
      createCalendarSchema.safeParse({ propertyId: 1, name: 'x', icsUrl: 'not-a-url' }).success,
    ).toBe(false);
  });

  it('createCalendarSchema accepts a valid payload with default interval', () => {
    const r = createCalendarSchema.parse({
      propertyId: 1,
      name: 'Main',
      icsUrl: 'https://www.airbnb.com/calendar/ical/123.ics?s=abc',
    });
    expect(r.syncIntervalMin).toBe(60);
  });

  it('createCalendarSchema clamps interval bounds', () => {
    expect(
      createCalendarSchema.safeParse({
        propertyId: 1,
        name: 'x',
        icsUrl: 'https://example.com/a.ics',
        syncIntervalMin: 1,
      }).success,
    ).toBe(false);
    expect(
      createCalendarSchema.safeParse({
        propertyId: 1,
        name: 'x',
        icsUrl: 'https://example.com/a.ics',
        syncIntervalMin: 10000,
      }).success,
    ).toBe(false);
    expect(
      updateCalendarSchema.safeParse({
        name: 'x',
        icsUrl: 'https://example.com/a.ics',
        syncIntervalMin: 60,
      }).success,
    ).toBe(true);
  });
});
