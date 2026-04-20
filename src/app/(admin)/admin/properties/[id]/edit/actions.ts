'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { updateProperty } from '@/modules/properties/service';
import { updatePropertySchema } from '@/modules/properties/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updatePropertyAction(
  id: number,
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const parsed = updatePropertySchema.safeParse({
    name: formData.get('name'),
    maxGuests: formData.get('maxGuests') || undefined,
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
  await updateProperty(id, parsed.data);
  revalidatePath('/admin/properties');
  revalidatePath(`/admin/properties/${id}`);
  redirect(`/admin/properties/${id}`);
}
