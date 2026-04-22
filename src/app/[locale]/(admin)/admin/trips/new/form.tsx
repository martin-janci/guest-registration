'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createTripAction } from './actions';

interface Props {
  properties: Array<{ id: number; name: string; maxGuests: number | null }>;
}

export function NewTripForm({ properties }: Props) {
  const [state, action, pending] = useActionState(createTripAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="title" label="Title" required error={fe.title} description="What you'll call this trip internally.">
        <Input id="title" name="title" required />
      </FormField>

      <FormField id="propertyId" label="Property" required error={fe.propertyId}>
        <Select id="propertyId" name="propertyId" required defaultValue="">
          <option value="" disabled>Choose a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="startDate" label="Start date" required error={fe.startDate}>
          <Input id="startDate" name="startDate" type="date" required />
        </FormField>
        <FormField id="endDate" label="End date" required error={fe.endDate}>
          <Input id="endDate" name="endDate" type="date" required />
        </FormField>
      </div>

      <FormField id="maxGuests" label="Max guests" required error={fe.maxGuests}>
        <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={2} required />
      </FormField>

      <FormField id="notes" label="Notes" description="Optional admin notes." error={fe.notes}>
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Link href="/admin/trips"><Button variant="ghost" type="button">Cancel</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create trip'}</Button>
      </div>
    </form>
  );
}
