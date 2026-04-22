import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { approveRegistration } from '@/modules/registrations/service';
import { sendMail } from '@/modules/email/service';
import { guestApprovedTemplate } from '@/modules/email/templates/guest-approved';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  const { id: idRaw } = await ctx.params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const form = await req.formData();
  const comment = (form.get('comment')?.toString().trim() || null);

  const reg = await approveRegistration(id, admin.id, comment);

  const firstGuest = reg.guests[0]?.firstName ?? 'there';
  try {
    await sendMail({
      to: reg.email,
      template: guestApprovedTemplate({
        guestFirstName: firstGuest,
        tripTitle: reg.trip.title,
        propertyName: reg.trip.property.name,
        adminComment: reg.adminComment,
      }),
    });
  } catch (err) {
    console.error('Approved email failed:', err);
  }

  revalidatePath('/admin/registrations');
  revalidatePath(`/admin/registrations/${id}`);
  return NextResponse.redirect(new URL(`/admin/registrations/${id}`, req.url), 303);
}
