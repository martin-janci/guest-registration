import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { softDeleteProperty } from '@/modules/properties/service';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await softDeleteProperty(id);
  revalidatePath('/admin/properties');
  return NextResponse.redirect(new URL('/admin/properties', req.url), 303);
}
