'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { updateTripAction } from './actions';

interface Props {
  id: number;
  initial: { title: string; startDate: string; endDate: string; maxGuests: number; notes: string | null };
}

export function EditTripForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updateTripAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <FormField id="title" label="Title" required error={fe.title}>
          <Input id="title" name="title" defaultValue={initial.title} required />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="startDate" label="Start date" required error={fe.startDate}>
            <Input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} required />
          </FormField>
          <FormField id="endDate" label="End date" required error={fe.endDate}>
            <Input id="endDate" name="endDate" type="date" defaultValue={initial.endDate} required />
          </FormField>
        </div>
        <FormField id="maxGuests" label="Max guests" required error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={initial.maxGuests} required />
        </FormField>
        <FormField id="notes" label="Notes" error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ''} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href={`/admin/trips/${id}`}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>

      <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
        <h2 className="text-sm font-semibold text-danger-700">Delete trip</h2>
        <p className="mt-1 text-xs text-danger-700/80">
          Hard-delete. Use this for test data only — real reservations should be kept for history.
        </p>
        <form
          action={`/admin/trips/${id}/delete`}
          method="post"
          className="mt-5 flex justify-end"
          onSubmit={(e) => { if (!confirm('Delete this trip?')) e.preventDefault(); }}
        >
          <Button type="submit" variant="danger">Delete</Button>
        </form>
      </section>
    </div>
  );
}
