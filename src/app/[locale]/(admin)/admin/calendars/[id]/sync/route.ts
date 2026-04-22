import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { syncCalendar } from '@/modules/airbnb-sync';
import { setFlash } from '@/lib/flash';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await syncCalendar(id);
  if (r.error) {
    await setFlash({ kind: 'error', message: `Sync failed: ${r.error}` });
  } else {
    await setFlash({
      kind: 'success',
      message: `Sync complete — ${r.created} created, ${r.updated} updated, ${r.skipped} skipped.`,
    });
  }
  revalidatePath('/admin/calendars');
  return NextResponse.redirect(new URL('/admin/calendars', req.url), 303);
}
