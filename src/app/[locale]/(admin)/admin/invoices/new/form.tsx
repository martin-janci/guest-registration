'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createInvoiceAction } from './actions';

function today(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function NewInvoiceForm() {
  const [state, action, pending] = useActionState(createInvoiceAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="clientName" label="Client name" required error={fe.clientName}>
        <Input id="clientName" name="clientName" required />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="clientEmail" label="Client email" error={fe.clientEmail}>
          <Input id="clientEmail" name="clientEmail" type="email" />
        </FormField>
        <FormField id="clientVatNumber" label="Client VAT" error={fe.clientVatNumber}>
          <Input id="clientVatNumber" name="clientVatNumber" />
        </FormField>
      </div>
      <FormField id="clientAddress" label="Client address" error={fe.clientAddress}>
        <Textarea id="clientAddress" name="clientAddress" rows={2} />
      </FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField id="issueDate" label="Issue date" required error={fe.issueDate}>
          <Input id="issueDate" name="issueDate" type="date" defaultValue={today()} required />
        </FormField>
        <FormField id="dueDate" label="Due date" error={fe.dueDate}>
          <Input id="dueDate" name="dueDate" type="date" />
        </FormField>
        <FormField id="currency" label="Currency" required error={fe.currency}>
          <Select id="currency" name="currency" defaultValue="EUR">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CZK">CZK</option>
          </Select>
        </FormField>
      </div>
      <FormField id="notes" label="Notes" error={fe.notes}>
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>
      <div className="mt-2 flex justify-end gap-3">
        <Link href="/admin/invoices"><Button variant="ghost" type="button">Cancel</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create invoice'}</Button>
      </div>
    </form>
  );
}
