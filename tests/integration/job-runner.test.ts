import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startPg } from '../setup/pg-container.js';

let ctx: Awaited<ReturnType<typeof startPg>>;

beforeAll(async () => { ctx = await startPg(); }, 120_000);
afterAll(async () => { await ctx.prisma.$disconnect(); await ctx.container.stop(); });
beforeEach(async () => {
  await ctx.prisma.invoiceItem.deleteMany();
  await ctx.prisma.invoice.deleteMany();
  await ctx.prisma.trip.deleteMany();
  await ctx.prisma.calendar.deleteMany();
  await ctx.prisma.property.deleteMany();
  await ctx.prisma.session.deleteMany();
  await ctx.prisma.user.deleteMany();
  await ctx.prisma.job.deleteMany();
});

describe('job-runner tick', () => {
  it('no work → ran: null', async () => {
    process.env.DATABASE_URL = ctx.url;
    const { tick } = await import('@/modules/job-runner');
    const r = await tick();
    expect(r.ran).toBeNull();
    expect(r.jobId).toBeNull();
  });

  it('executes an INVOICE_OVERDUE_FLIP job and marks it DONE', async () => {
    process.env.DATABASE_URL = ctx.url;
    const jobs = await import('@/modules/jobs/service');
    const { tick } = await import('@/modules/job-runner');

    const job = await jobs.enqueue({ kind: 'INVOICE_OVERDUE_FLIP', payload: {} });
    const r = await tick();
    expect(r.ran).toBe('INVOICE_OVERDUE_FLIP');
    expect(r.jobId).toBe(job.id);
    expect(r.error).toBeNull();

    const after = await jobs.getJobById(job.id);
    expect(after?.status).toBe('DONE');
  });

  it('failed handler → job is rescheduled PENDING with lastError', async () => {
    process.env.DATABASE_URL = ctx.url;
    const jobs = await import('@/modules/jobs/service');
    const { tick } = await import('@/modules/job-runner');

    // AIRBNB_SYNC with malformed payload → handler throws (zod parse).
    const job = await ctx.prisma.job.create({
      data: { kind: 'AIRBNB_SYNC', payload: { nope: true }, status: 'PENDING' },
    });

    const r = await tick();
    expect(r.ran).toBe('AIRBNB_SYNC');
    expect(r.error).not.toBeNull();

    const after = await jobs.getJobById(job.id);
    // With attempts=1, should reschedule to PENDING with runAfter ~1 min.
    expect(after?.status).toBe('PENDING');
    expect(after?.lastError).not.toBeNull();
    expect(after?.runAfter.getTime()).toBeGreaterThan(Date.now() + 50_000);
  });

  it('runUntilEmpty runs multiple jobs', async () => {
    process.env.DATABASE_URL = ctx.url;
    const jobs = await import('@/modules/jobs/service');
    const runner = await import('@/modules/job-runner');

    await jobs.enqueue({ kind: 'INVOICE_OVERDUE_FLIP', payload: {} });
    await jobs.enqueue({ kind: 'INVOICE_OVERDUE_FLIP', payload: {} });

    const results = await runner.runUntilEmpty(10);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ran === 'INVOICE_OVERDUE_FLIP')).toBe(true);
  });
});
