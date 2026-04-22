'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createTripAction } from './actions';
import { useTranslations } from 'next-intl';

interface Props {
  properties: Array<{ id: number; name: string; maxGuests: number | null }>;
}

export function NewTripForm({ properties }: Props) {
  const t = useTranslations('admin.trips.form');
  const [state, action, pending] = useActionState(createTripAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="title" label={t('fieldTitle')} required error={fe.title} description={t('fieldTitleHint')}>
        <Input id="title" name="title" required />
      </FormField>

      <FormField id="propertyId" label={t('fieldProperty')} required error={fe.propertyId}>
        <Select id="propertyId" name="propertyId" required defaultValue="">
          <option value="" disabled>{t('fieldPropertyPlaceholder')}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="startDate" label={t('fieldStartDate')} required error={fe.startDate}>
          <Input id="startDate" name="startDate" type="date" required />
        </FormField>
        <FormField id="endDate" label={t('fieldEndDate')} required error={fe.endDate}>
          <Input id="endDate" name="endDate" type="date" required />
        </FormField>
      </div>

      <FormField id="maxGuests" label={t('fieldMaxGuests')} required error={fe.maxGuests}>
        <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} defaultValue={2} required />
      </FormField>

      <FormField id="notes" label={t('fieldNotes')} description={t('fieldNotesHint')} error={fe.notes}>
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Link href="/admin/trips"><Button variant="ghost" type="button">{t('cancelButton')}</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? t('creating') : t('createButton')}</Button>
      </div>
    </form>
  );
}
