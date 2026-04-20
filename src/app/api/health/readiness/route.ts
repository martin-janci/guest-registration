import { NextResponse } from 'next/server';
import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', checks: { db: 'ok' } });
  } catch (err) {
    logger.error({ err }, 'readiness check failed');
    return NextResponse.json(
      { status: 'error', checks: { db: 'fail' } },
      { status: 503 },
    );
  }
}
