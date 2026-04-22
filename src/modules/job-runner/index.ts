import crypto from 'node:crypto';
import { claim, markDone, markFailed } from '@/modules/jobs/service';
import { airbnbSyncHandler } from '@/modules/jobs/handlers/airbnb-sync';
import { invoiceOverdueFlipHandler } from '@/modules/jobs/handlers/invoice-overdue-flip';

const WORKER_ID = `worker-${crypto.randomBytes(4).toString('hex')}`;

export interface TickResult {
  ran: 'AIRBNB_SYNC' | 'INVOICE_OVERDUE_FLIP' | null;
  jobId: number | null;
  error: string | null;
}

export async function tick(): Promise<TickResult> {
  const job = await claim(WORKER_ID);
  if (!job) return { ran: null, jobId: null, error: null };

  try {
    if (job.kind === 'AIRBNB_SYNC') {
      await airbnbSyncHandler(job.payload);
    } else if (job.kind === 'INVOICE_OVERDUE_FLIP') {
      await invoiceOverdueFlipHandler();
    } else {
      const kind: never = job.kind;
      throw new Error(`Unknown job kind: ${kind as string}`);
    }
    await markDone(job.id);
    return { ran: job.kind, jobId: job.id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailed(job.id, message);
    return { ran: job.kind, jobId: job.id, error: message };
  }
}

/** Run up to N ticks or until no job is claimed. Returns results. */
export async function runUntilEmpty(max = 50): Promise<TickResult[]> {
  const results: TickResult[] = [];
  for (let i = 0; i < max; i++) {
    const r = await tick();
    if (r.ran === null) break;
    results.push(r);
  }
  return results;
}
