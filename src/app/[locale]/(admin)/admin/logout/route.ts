import { NextResponse, type NextRequest } from 'next/server';
import { invalidateCurrentSession } from '@/modules/auth/current';

export async function POST(req: NextRequest) {
  await invalidateCurrentSession();
  return NextResponse.redirect(new URL('/login', req.url), 303);
}
