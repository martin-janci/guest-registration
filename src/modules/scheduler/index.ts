import cron from 'node-cron';
import { prisma } from '@/db/client';
import { enqueue } from '@/modules/jobs/service';
import { tick } from '@/modules/job-runner';

/**
 * Find calendars whose sync is due (lastSyncedAt is null OR older than syncIntervalMin minutes)
 * and enqueue AIRBNB_SYNC jobs for them. Deduplicates against existing PENDING jobs.
 */
export async function enqueueDueAirbnbSyncs(now = new Date()): Promise<number> {
  const calendars = await prisma.calendar.findMany({
    select: { id: true, syncIntervalMin: true, lastSyncedAt: true },
  });

  let enqueued = 0;
  for (const cal of calendars) {
    const dueAt = cal.lastSyncedAt
      ? new Date(cal.lastSyncedAt.getTime() + cal.syncIntervalMin * 60_000)
      : new Date(0);
    if (dueAt.getTime() > now.getTime()) continue;

    // Dedupe: skip if an AIRBNB_SYNC job for this calendar is already PENDING.
    const existing = await prisma.job.findFirst({
      where: {
        kind: 'AIRBNB_SYNC',
        status: 'PENDING',
        payload: { path: ['calendarId'], equals: cal.id },
      },
    });
    if (existing) continue;

    await enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: cal.id } });
    enqueued++;
  }
  return enqueued;
}

/** Start in-process cron schedules. Safe to call multiple times (guarded). */
let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  // Every 5 minutes: enqueue due airbnb syncs.
  cron.schedule('*/5 * * * *', async () => {
    try {
      await enqueueDueAirbnbSyncs();
    } catch (err) {
      console.error('enqueueDueAirbnbSyncs failed:', err);
    }
  });

  // Daily at 00:05 UTC: enqueue the overdue flip.
  cron.schedule('5 0 * * *', async () => {
    try {
      await enqueue({ kind: 'INVOICE_OVERDUE_FLIP', payload: {} });
    } catch (err) {
      console.error('Enqueue INVOICE_OVERDUE_FLIP failed:', err);
    }
  }, { timezone: 'UTC' });

  // Every 30 seconds: run one tick of the queue.
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await tick();
    } catch (err) {
      console.error('Job tick failed:', err);
    }
  });
}
