import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { deleteItem } from '@/modules/invoices/service';

interface RouteContext { params: Promise<{ id: string; itemId: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw, itemId: itemIdRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  const itemId = Number.parseInt(itemIdRaw, 10);
  if (!Number.isFinite(id) || !Number.isFinite(itemId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await deleteItem(itemId);
  revalidatePath(`/admin/invoices/${id}`);
  return NextResponse.redirect(new URL(`/admin/invoices/${id}`, req.url), 303);
}
