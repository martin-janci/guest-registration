import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { rejectRegistration } from '@/modules/registrations/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const form = await req.formData();
  const comment = form.get('comment')?.toString().trim();
  if (!comment) {
    return NextResponse.json({ error: 'Reject requires a reason' }, { status: 400 });
  }

  await rejectRegistration(id, admin.id, comment);

  revalidatePath('/admin/registrations');
  revalidatePath(`/admin/registrations/${id}`);
  return NextResponse.redirect(new URL(`/admin/registrations/${id}`, req.url), 303);
}
