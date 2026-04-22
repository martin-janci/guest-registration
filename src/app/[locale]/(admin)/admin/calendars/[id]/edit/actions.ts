'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { updateCalendar } from '@/modules/calendars/service';
import { updateCalendarSchema } from '@/modules/calendars/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updateCalendarAction(
  id: number,
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  await requireAdmin();
  const parsed = updateCalendarSchema.safeParse({
    name: formData.get('name'),
    icsUrl: formData.get('icsUrl'),
    syncIntervalMin: formData.get('syncIntervalMin'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }
  await updateCalendar(id, parsed.data);
  revalidatePath('/admin/calendars');
  return redirect('/admin/calendars');
}
