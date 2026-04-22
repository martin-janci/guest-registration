import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { retryFailed } from '@/modules/jobs/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await retryFailed(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'retry failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  revalidatePath('/admin/jobs');
  return NextResponse.redirect(new URL('/admin/jobs', req.url), 303);
}
