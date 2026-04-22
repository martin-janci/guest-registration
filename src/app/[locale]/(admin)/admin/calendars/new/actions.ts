'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { createCalendar } from '@/modules/calendars/service';
import { createCalendarSchema } from '@/modules/calendars/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createCalendarAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();
  const parsed = createCalendarSchema.safeParse({
    propertyId: formData.get('propertyId'),
    name: formData.get('name'),
    icsUrl: formData.get('icsUrl'),
    syncIntervalMin: formData.get('syncIntervalMin') || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  await createCalendar(parsed.data);
  revalidatePath('/admin/calendars');
  return await redirect('/admin/calendars');
}
