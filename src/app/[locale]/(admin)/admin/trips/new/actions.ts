'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { createTrip } from '@/modules/trips/service';
import { createTripSchema } from '@/modules/trips/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createTripAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  const admin = await requireAdmin();
  const parsed = createTripSchema.safeParse({
    title: formData.get('title'),
    propertyId: formData.get('propertyId'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    maxGuests: formData.get('maxGuests'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  const trip = await createTrip(admin.id, parsed.data);
  revalidatePath('/admin/trips');
  return await redirect(`/admin/trips/${trip.id}`);
}
