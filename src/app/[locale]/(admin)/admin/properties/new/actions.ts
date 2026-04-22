'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { createProperty } from '@/modules/properties/service';
import { createPropertySchema } from '@/modules/properties/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createPropertyAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  const admin = await requireAdmin();

  const parsed = createPropertySchema.safeParse({
    name: formData.get('name'),
    // Default owner to current admin if not specified (single-tenant).
    ownerId: formData.get('ownerId') ?? admin.id,
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

  const p = await createProperty(parsed.data);
  revalidatePath('/admin/properties');
  redirect(`/admin/properties/${p.id}`);
}
