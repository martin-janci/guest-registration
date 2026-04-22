import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { enqueueDueAirbnbSyncs } from '@/modules/scheduler';
import { runUntilEmpty } from '@/modules/job-runner';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const enqueued = await enqueueDueAirbnbSyncs();
  const results = await runUntilEmpty(20);

  return NextResponse.json({
    enqueued,
    ran: results.length,
    errors: results.filter((r) => r.error).map((r) => ({ jobId: r.jobId, error: r.error })),
  });
}
