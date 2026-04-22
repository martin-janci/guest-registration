'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { createTask } from '@/modules/housekeeping/service';
import { createTaskSchema } from '@/modules/housekeeping/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createTaskAction(_prev: State | undefined, formData: FormData): Promise<State> {
  await requireAdmin();
  const parsed = createTaskSchema.safeParse({
    tripId: formData.get('tripId'),
    housekeeperId: formData.get('housekeeperId'),
    date: formData.get('date'),
    payAmount: formData.get('payAmount'),
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
  const task = await createTask(parsed.data);
  revalidatePath('/admin/housekeeping');
  redirect(`/admin/housekeeping/${task.id}`);
}
