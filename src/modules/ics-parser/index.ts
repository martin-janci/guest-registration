import ical from 'node-ical';

export interface IcsEvent {
  uid: string;
  startDate: Date;
  endDate: Date;
  summary: string;
  description: string;
}

/**
 * node-ical returns DTSTART;VALUE=DATE values as local-midnight Dates with a
 * `dateOnly: true` marker. Normalise those to UTC-midnight so that
 * `.toISOString().slice(0,10)` always returns the calendar date as written.
 */
function normaliseDate(d: Date): Date {
  if ((d as Date & { dateOnly?: boolean }).dateOnly) {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  return d;
}

export function parseIcs(text: string): IcsEvent[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const raw = ical.sync.parseICS(trimmed);
  const events: IcsEvent[] = [];
  for (const [, entry] of Object.entries(raw)) {
    if ((entry as { type?: string }).type !== 'VEVENT') continue;
    const e = entry as {
      uid?: string;
      start?: Date;
      end?: Date;
      summary?: string | { val?: string };
      description?: string | { val?: string };
    };
    if (!e.uid || !e.start || !e.end) continue;
    events.push({
      uid: e.uid,
      startDate: normaliseDate(e.start),
      endDate: normaliseDate(e.end),
      summary: typeof e.summary === 'string' ? e.summary : (e.summary?.val ?? ''),
      description:
        typeof e.description === 'string' ? e.description : (e.description?.val ?? ''),
    });
  }
  return events;
}

const AIRBNB_URL_RE = /https?:\/\/www\.airbnb\.[a-z.]+\/hosting\/reservations\/details\/([A-Z0-9]+)/i;
const SUMMARY_NAME_RE = /^Reserved\s*\(([^)]+)\)\s*$/i;

export function extractAirbnbReservation(
  event: IcsEvent,
): { confirmCode: string; guestName: string | null } | null {
  if (/not available/i.test(event.summary)) return null;
  const m = event.description.match(AIRBNB_URL_RE);
  if (!m || !m[1]) return null;
  const nameMatch = event.summary.match(SUMMARY_NAME_RE);
  return {
    confirmCode: m[1],
    guestName: nameMatch?.[1] ?? null,
  };
}
