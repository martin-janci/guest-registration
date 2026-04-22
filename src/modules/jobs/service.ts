import type { Job } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  enqueueInputSchema,
  jobFiltersSchema,
  nextRunAfter,
  MAX_ATTEMPTS,
  type EnqueueInput,
  type JobFilters,
} from './schema';

export async function enqueue(input: EnqueueInput): Promise<Job> {
  const data = enqueueInputSchema.parse(input);
  return prisma.job.create({
    data: {
      kind: data.kind,
      payload: data.payload as object,
      runAfter: data.runAfter ?? new Date(),
    },
  });
}

/** Claim one due PENDING job. Single-instance-safe via transaction. Returns null if none. */
export async function claim(workerId: string): Promise<Job | null> {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.job.findFirst({
      where: { status: 'PENDING', runAfter: { lte: new Date() } },
      orderBy: { runAfter: 'asc' },
    });
    if (!candidate) return null;
    return tx.job.update({
      where: { id: candidate.id },
      data: {
        status: 'RUNNING',
        lockedAt: new Date(),
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
  });
}

export async function markDone(id: number): Promise<void> {
  await prisma.job.update({
    where: { id },
    data: { status: 'DONE', lockedAt: null, lockedBy: null, lastError: null },
  });
}

export async function markFailed(id: number, error: string): Promise<void> {
  const job = await prisma.job.findUniqueOrThrow({ where: { id } });
  const nextRun = nextRunAfter(job.attempts);
  if (nextRun) {
    await prisma.job.update({
      where: { id },
      data: {
        status: 'PENDING',
        lockedAt: null,
        lockedBy: null,
        lastError: error.slice(0, 2000),
        runAfter: nextRun,
      },
    });
  } else {
    await prisma.job.update({
      where: { id },
      data: {
        status: 'FAILED',
        lockedAt: null,
        lockedBy: null,
        lastError: error.slice(0, 2000),
      },
    });
  }
}

export async function listJobs(filters: JobFilters = {}): Promise<Job[]> {
  const parsed = jobFiltersSchema.parse(filters);
  return prisma.job.findMany({
    where: {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.kind ? { kind: parsed.kind } : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
  });
}

export async function getJobById(id: number): Promise<Job | null> {
  return prisma.job.findUnique({ where: { id } });
}

/** Reset a FAILED job back to PENDING (attempts unchanged — admin override). */
export async function retryFailed(id: number): Promise<Job> {
  const job = await prisma.job.findUniqueOrThrow({ where: { id } });
  if (job.status !== 'FAILED') {
    throw new Error(`Only FAILED jobs can be retried (got ${job.status})`);
  }
  return prisma.job.update({
    where: { id },
    data: {
      status: 'PENDING',
      runAfter: new Date(),
      lastError: null,
      attempts: 0, // fresh start — admin explicitly chose to retry
    },
  });
}

export { MAX_ATTEMPTS };
