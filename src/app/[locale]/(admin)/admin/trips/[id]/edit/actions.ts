'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { updateTrip } from '@/modules/trips/service';
import { updateTripSchema } from '@/modules/trips/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updateTripAction(
  id: number,
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();
  const parsed = updateTripSchema.safeParse({
    title: formData.get('title'),
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
  await updateTrip(id, parsed.data);
  revalidatePath('/admin/trips');
  revalidatePath(`/admin/trips/${id}`);
  redirect(`/admin/trips/${id}`);
}
