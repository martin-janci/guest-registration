import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.job.deleteMany();
});

describe('jobs service — integration', () => {
  it('enqueue → claim → markDone happy path', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/jobs/service');

    const job = await svc.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: 1 } });
    expect(job.status).toBe('PENDING');

    const claimed = await svc.claim('worker-A');
    expect(claimed).not.toBeNull();
    expect(claimed!.id).toBe(job.id);
    expect(claimed!.status).toBe('RUNNING');
    expect(claimed!.lockedBy).toBe('worker-A');
    expect(claimed!.attempts).toBe(1);

    await svc.markDone(claimed!.id);
    const after = await svc.getJobById(claimed!.id);
    expect(after?.status).toBe('DONE');
    expect(after?.lockedAt).toBeNull();
  });

  it('claim returns null when no PENDING jobs are due', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/jobs/service');
    expect(await svc.claim('worker-A')).toBeNull();
  });

  it('claim skips jobs with runAfter in the future', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/jobs/service');
    await svc.enqueue({
      kind: 'AIRBNB_SYNC',
      payload: { calendarId: 1 },
      runAfter: new Date(Date.now() + 10 * 60_000),
    });
    expect(await svc.claim('worker-A')).toBeNull();
  });

  it('markFailed reschedules for retry within MAX_ATTEMPTS', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/jobs/service');

    const job = await svc.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: 1 } });
    const first = await svc.claim('worker-A');
    expect(first!.attempts).toBe(1);
    await svc.markFailed(first!.id, 'network error');

    const after = await svc.getJobById(job.id);
    expect(after?.status).toBe('PENDING');
    expect(after?.lastError).toBe('network error');
    expect(after?.runAfter.getTime()).toBeGreaterThan(Date.now() + 50_000);
  });

  it('markFailed on final attempt sets status to FAILED', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/jobs/service');

    const job = await svc.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: 1 } });

    // Claim + fail three times to exhaust attempts.
    for (let i = 0; i < 3; i++) {
      await ctx.prisma.job.update({ where: { id: job.id }, data: { runAfter: new Date(0) } });
      const claimed = await svc.claim('worker-A');
      expect(claimed).not.toBeNull();
      await svc.markFailed(claimed!.id, 'boom');
    }
    const after = await svc.getJobById(job.id);
    expect(after?.status).toBe('FAILED');
    expect(after?.attempts).toBe(3);
  });

  it('retryFailed resets a FAILED job to PENDING with attempts=0', async () => {
    process.env.DATABASE_URL = ctx.url;
    const svc = await import('@/modules/jobs/service');

    const job = await svc.enqueue({ kind: 'AIRBNB_SYNC', payload: { calendarId: 1 } });
    await ctx.prisma.job.update({
      where: { id: job.id },
      data: { status: 'FAILED', attempts: 3, lastError: 'boom' },
    });
    const reset = await svc.retryFailed(job.id);
    expect(reset.status).toBe('PENDING');
    expect(reset.attempts).toBe(0);
    expect(reset.lastError).toBeNull();
  });
});
