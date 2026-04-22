'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createPropertyAction } from './actions';

export default function NewPropertyPage() {
  const [state, action, pending] = useActionState(createPropertyAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">New property</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Add an apartment or cottage you want to manage.
        </p>
      </header>

      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}

        <FormField id="name" label="Name" required error={fe.name}>
          <Input id="name" name="name" autoComplete="off" required />
        </FormField>

        <FormField id="maxGuests" label="Max guests" description="Capacity limit on registrations." error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} />
        </FormField>

        <FormField id="notes" label="Internal notes" description="Only visible to admins. Nothing here appears to guests." error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} />
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Link href="/admin/properties"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create property'}</Button>
        </div>
      </form>
    </div>
  );
}
