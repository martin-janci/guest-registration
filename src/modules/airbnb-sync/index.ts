import { parseIcs, extractAirbnbReservation } from '@/modules/ics-parser';
import * as calendars from '@/modules/calendars/service';
import * as trips from '@/modules/trips/service';

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  error: string | null;
}

export type IcsFetcher = (url: string) => Promise<string>;

const defaultFetcher: IcsFetcher = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

export async function syncCalendar(
  calendarId: number,
  opts: { fetcher?: IcsFetcher } = {},
): Promise<SyncResult> {
  const fetcher = opts.fetcher ?? defaultFetcher;
  const cal = await calendars.getCalendarById(calendarId);
  if (!cal) {
    return { created: 0, updated: 0, skipped: 0, error: 'calendar not found' };
  }

  let text: string;
  try {
    text = await fetcher(cal.icsUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed';
    await calendars.touchLastSynced(cal.id, {
      lastSyncedAt: new Date(),
      lastSyncError: message,
    });
    return { created: 0, updated: 0, skipped: 0, error: message };
  }

  const events = parseIcs(text);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ev of events) {
    const reservation = extractAirbnbReservation(ev);
    if (!reservation) {
      skipped++;
      continue;
    }
    const result = await trips.upsertExternalTrip({
      adminId: cal.property.ownerId,
      propertyId: cal.propertyId,
      calendarId: cal.id,
      source: 'AIRBNB_ICS',
      externalReservationId: ev.uid,
      externalConfirmCode: reservation.confirmCode,
      externalGuestName: reservation.guestName,
      externalGuestCount: null,
      startDate: ev.startDate,
      endDate: ev.endDate,
      title: reservation.guestName
        ? `Airbnb · ${reservation.guestName}`
        : `Airbnb · ${reservation.confirmCode}`,
      maxGuests: 8,
    });
    if (result.created) created++;
    else updated++;
  }

  await calendars.touchLastSynced(cal.id, {
    lastSyncedAt: new Date(),
    lastSyncError: null,
  });
  return { created, updated, skipped, error: null };
}
