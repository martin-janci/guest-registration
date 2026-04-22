'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createCalendarAction } from './actions';

interface Props {
  properties: Array<{ id: number; name: string }>;
}

export function NewCalendarForm({ properties }: Props) {
  const [state, action, pending] = useActionState(createCalendarAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="propertyId" label="Property" required error={fe.propertyId}>
        <Select id="propertyId" name="propertyId" required defaultValue="">
          <option value="" disabled>Choose a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <FormField id="name" label="Name" required error={fe.name} description="e.g. 'Airbnb — Tatranská Perla 2B'.">
        <Input id="name" name="name" required />
      </FormField>

      <FormField id="icsUrl" label="iCal URL" required error={fe.icsUrl}>
        <Input id="icsUrl" name="icsUrl" type="url" inputMode="url" required placeholder="https://www.airbnb.com/calendar/ical/…" />
      </FormField>

      <FormField id="syncIntervalMin" label="Sync interval (minutes)" description="Used when scheduled sync is enabled (M7)." error={fe.syncIntervalMin}>
        <Input id="syncIntervalMin" name="syncIntervalMin" type="number" min={5} max={1440} defaultValue={60} />
      </FormField>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Link href="/admin/calendars"><Button variant="ghost" type="button">Cancel</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create calendar'}</Button>
      </div>
    </form>
  );
}
