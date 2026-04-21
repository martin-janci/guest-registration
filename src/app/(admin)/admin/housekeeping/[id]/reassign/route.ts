import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { reassignTask } from '@/modules/housekeeping/service';
import { reassignSchema } from '@/modules/housekeeping/schema';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const form = await req.formData();
  const parsed = reassignSchema.safeParse({
    housekeeperId: form.get('housekeeperId'),
    payAmount: form.get('payAmount') || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid' }, { status: 400 });
  await reassignTask(id, parsed.data);
  revalidatePath('/admin/housekeeping');
  revalidatePath(`/admin/housekeeping/${id}`);
  return NextResponse.redirect(new URL(`/admin/housekeeping/${id}`, req.url), 303);
}
