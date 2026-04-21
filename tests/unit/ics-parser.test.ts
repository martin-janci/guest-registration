import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseIcs, extractAirbnbReservation } from '@/modules/ics-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', 'src', 'modules', 'ics-parser', 'fixtures');

describe('parseIcs', () => {
  it('returns events from a minimal ics with start, end, summary, uid', () => {
    const text = readFileSync(join(fixturesDir, 'simple.ics'), 'utf8');
    const events = parseIcs(text);
    expect(events).toHaveLength(1);
    const e = events[0]!;
    expect(e.uid).toBe('example-1@test.local');
    expect(e.startDate.toISOString().slice(0, 10)).toBe('2026-05-10');
    expect(e.endDate.toISOString().slice(0, 10)).toBe('2026-05-13');
    expect(e.summary).toBe('Sample reservation');
  });

  it('returns all VEVENTs from an Airbnb-shaped ics', () => {
    const text = readFileSync(join(fixturesDir, 'airbnb.ics'), 'utf8');
    const events = parseIcs(text);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.summary).sort()).toEqual([
      'Not available',
      'Reserved',
      'Reserved (Anna Novotná)',
    ]);
  });

  it('returns [] on empty input', () => {
    expect(parseIcs('')).toEqual([]);
  });
});

describe('extractAirbnbReservation', () => {
  it('extracts confirmCode from the Airbnb reservation URL', () => {
    const text = readFileSync(join(fixturesDir, 'airbnb.ics'), 'utf8');
    const [a, b, c] = parseIcs(text);

    expect(extractAirbnbReservation(a!)).toEqual({ confirmCode: 'HMABC12345', guestName: null });
    expect(extractAirbnbReservation(b!)).toBeNull(); // "Not available" = blocked
    expect(extractAirbnbReservation(c!)).toEqual({ confirmCode: 'HMDEF67890', guestName: 'Anna Novotná' });
  });
});
