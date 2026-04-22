'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { createInvoice } from '@/modules/invoices/service';
import { createInvoiceSchema } from '@/modules/invoices/schema';

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createInvoiceAction(
  _prev: State | undefined,
  formData: FormData,
): Promise<State> {
  const admin = await requireAdmin();

  const parsed = createInvoiceSchema.safeParse({
    clientName: formData.get('clientName'),
    clientEmail: formData.get('clientEmail') || undefined,
    clientVatNumber: formData.get('clientVatNumber') || undefined,
    clientAddress: formData.get('clientAddress') || undefined,
    issueDate: formData.get('issueDate'),
    dueDate: formData.get('dueDate') || undefined,
    currency: (formData.get('currency') || 'EUR').toString(),
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

  const invoice = await createInvoice(admin.id, parsed.data);
  revalidatePath('/admin/invoices');
  return await redirect(`/admin/invoices/${invoice.id}`);
}
