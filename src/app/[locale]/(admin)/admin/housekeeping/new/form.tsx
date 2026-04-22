'use client';
import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createTaskAction } from './actions';

interface TripOption { id: number; title: string; propertyName: string; endDate: string }
interface HkOption { id: number; username: string; email: string }

export function NewTaskForm({ trips, housekeepers }: { trips: TripOption[]; housekeepers: HkOption[] }) {
  const [state, action, pending] = useActionState(createTaskAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="tripId" label="Trip" required error={fe.tripId}>
        <Select id="tripId" name="tripId" required defaultValue="">
          <option value="" disabled>Choose a trip…</option>
          {trips.map((t) => (<option key={t.id} value={t.id}>{t.propertyName} · {t.title} · {t.endDate}</option>))}
        </Select>
      </FormField>
      <FormField id="housekeeperId" label="Housekeeper" required error={fe.housekeeperId}>
        <Select id="housekeeperId" name="housekeeperId" required defaultValue="">
          <option value="" disabled>Choose a housekeeper…</option>
          {housekeepers.map((h) => (<option key={h.id} value={h.id}>{h.username} ({h.email})</option>))}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="date" label="Cleaning date" required error={fe.date}>
          <Input id="date" name="date" type="date" required />
        </FormField>
        <FormField id="payAmount" label="Pay (€)" required error={fe.payAmount}>
          <Input id="payAmount" name="payAmount" inputMode="decimal" placeholder="20.00" required />
        </FormField>
      </div>
      <FormField id="notes" label="Notes" error={fe.notes}>
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>
      <div className="mt-2 flex justify-end gap-3">
        <Link href="/admin/housekeeping"><Button variant="ghost" type="button">Cancel</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create task'}</Button>
      </div>
    </form>
  );
}
