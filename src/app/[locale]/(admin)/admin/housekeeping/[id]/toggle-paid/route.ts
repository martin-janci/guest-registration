import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { getTaskById, markPaid } from '@/modules/housekeeping/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const task = await getTaskById(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await markPaid(id, !task.paid);
  revalidatePath('/admin/housekeeping');
  revalidatePath(`/admin/housekeeping/${id}`);
  return NextResponse.redirect(new URL(`/admin/housekeeping/${id}`, req.url), 303);
}
