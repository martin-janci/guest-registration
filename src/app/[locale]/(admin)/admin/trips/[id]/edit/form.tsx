'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { updateTripAction } from './actions';
import { useTranslations } from 'next-intl';

interface Props {
  id: number;
  initial: { title: string; startDate: string; endDate: string; maxGuests: number; notes: string | null };
}

export function EditTripForm({ id, initial }: Props) {
  const t = useTranslations('admin.trips.form');
  const tDelete = useTranslations('admin.trips.delete');
  const [state, action, pending] = useActionState(
    updateTripAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <FormField id="title" label={t('fieldTitle')} required error={fe.title}>
          <Input id="title" name="title" defaultValue={initial.title} required />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="startDate" label={t('fieldStartDate')} required error={fe.startDate}>
            <Input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} required />
          </FormField>
          <FormField id="endDate" label={t('fieldEndDate')} required error={fe.endDate}>
            <Input id="endDate" name="endDate" type="date" defaultValue={initial.endDate} required />
          </FormField>
        </div>
        <FormField id="maxGuests" label={t('fieldMaxGuests')} required error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={initial.maxGuests} required />
        </FormField>
        <FormField id="notes" label={t('fieldNotes')} error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ''} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href={`/admin/trips/${id}`}><Button variant="ghost" type="button">{t('cancelButton')}</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? t('saving') : t('saveButton')}</Button>
        </div>
      </form>

      <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
        <h2 className="text-sm font-semibold text-danger-700">{tDelete('heading')}</h2>
        <p className="mt-1 text-xs text-danger-700/80">
          {tDelete('body')}
        </p>
        <form
          action={`/admin/trips/${id}/delete`}
          method="post"
          className="mt-5 flex justify-end"
          onSubmit={(e) => { if (!confirm(tDelete('confirm'))) e.preventDefault(); }}
        >
          <Button type="submit" variant="danger">{tDelete('button')}</Button>
        </form>
      </section>
    </div>
  );
}
