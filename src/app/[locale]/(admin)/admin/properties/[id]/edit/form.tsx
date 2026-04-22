'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { updatePropertyAction } from './actions';

interface Props {
  id: number;
  initial: { name: string; maxGuests: number | null; notes: string | null; deleted: boolean };
}

export function EditPropertyForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updatePropertyAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}
        <FormField id="name" label="Name" required error={fe.name}>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </FormField>
        <FormField id="maxGuests" label="Max guests" error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={initial.maxGuests ?? ''} />
        </FormField>
        <FormField id="notes" label="Internal notes" error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ''} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href={`/admin/properties/${id}`}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>

      {initial.deleted ? (
        <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-fg">Restore property</h2>
          <form action={`/admin/properties/${id}/restore`} method="post" className="mt-5 flex justify-end">
            <Button type="submit" variant="secondary">Restore</Button>
          </form>
        </section>
      ) : (
        <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
          <h2 className="text-sm font-semibold text-danger-700">Delete property</h2>
          <p className="mt-1 text-xs text-danger-700/80">
            Soft-delete. All trips, registrations, and housekeeping tasks that reference it are preserved.
          </p>
          <form
            action={`/admin/properties/${id}/delete`}
            method="post"
            className="mt-5 flex justify-end"
            onSubmit={(e) => { if (!confirm('Soft-delete this property?')) e.preventDefault(); }}
          >
            <Button type="submit" variant="danger">Delete</Button>
          </form>
        </section>
      )}
    </div>
  );
}
