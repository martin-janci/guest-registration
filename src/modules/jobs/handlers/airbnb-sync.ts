import { syncCalendar } from '@/modules/airbnb-sync';
import { airbnbSyncPayloadSchema } from '@/modules/jobs/schema';

export async function airbnbSyncHandler(payload: unknown): Promise<void> {
  const data = airbnbSyncPayloadSchema.parse(payload);
  const result = await syncCalendar(data.calendarId);
  if (result.error) {
    throw new Error(`Calendar ${data.calendarId} sync failed: ${result.error}`);
  }
}
