'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { updateInvoiceHeaderAction } from './actions';

interface Props {
  id: number;
  initial: {
    clientName: string;
    clientEmail: string | null;
    clientVatNumber: string | null;
    clientAddress: string | null;
    issueDate: string;
    dueDate: string | null;
    currency: string;
    notes: string | null;
  };
}

export function EditInvoiceForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updateInvoiceHeaderAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <FormField id="clientName" label="Client name" required error={fe.clientName}>
          <Input id="clientName" name="clientName" defaultValue={initial.clientName} required />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="clientEmail" label="Client email" error={fe.clientEmail}>
            <Input id="clientEmail" name="clientEmail" type="email" defaultValue={initial.clientEmail ?? ''} />
          </FormField>
          <FormField id="clientVatNumber" label="Client VAT" error={fe.clientVatNumber}>
            <Input id="clientVatNumber" name="clientVatNumber" defaultValue={initial.clientVatNumber ?? ''} />
          </FormField>
        </div>
        <FormField id="clientAddress" label="Client address" error={fe.clientAddress}>
          <Textarea id="clientAddress" name="clientAddress" rows={2} defaultValue={initial.clientAddress ?? ''} />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField id="issueDate" label="Issue date" required error={fe.issueDate}>
            <Input id="issueDate" name="issueDate" type="date" defaultValue={initial.issueDate} required />
          </FormField>
          <FormField id="dueDate" label="Due date" error={fe.dueDate}>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={initial.dueDate ?? ''} />
          </FormField>
          <FormField id="currency" label="Currency" required error={fe.currency}>
            <Select id="currency" name="currency" defaultValue={initial.currency}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="CZK">CZK</option>
            </Select>
          </FormField>
        </div>
        <FormField id="notes" label="Notes" error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ''} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href={`/admin/invoices/${id}`}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>

      <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
        <h2 className="text-sm font-semibold text-danger-700">Delete invoice</h2>
        <p className="mt-1 text-xs text-danger-700/80">
          Hard-delete. Prefer archiving (mark paid) for production invoices; use this for drafts and test data.
        </p>
        <form
          action={`/admin/invoices/${id}/delete`}
          method="post"
          className="mt-5 flex justify-end"
        >
          <Button type="submit" variant="danger">Delete</Button>
        </form>
      </section>
    </div>
  );
}
