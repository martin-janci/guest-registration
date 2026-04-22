'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createCalendarAction } from './actions';
import { useTranslations } from 'next-intl';

interface Props {
  properties: Array<{ id: number; name: string }>;
}

export function NewCalendarForm({ properties }: Props) {
  const t = useTranslations('admin.calendars.form');
  const [state, action, pending] = useActionState(createCalendarAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <FormField id="propertyId" label={t('fieldProperty')} required error={fe.propertyId}>
        <Select id="propertyId" name="propertyId" required defaultValue="">
          <option value="" disabled>{t('fieldPropertyPlaceholder')}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormField>

      <FormField id="name" label={t('fieldName')} required error={fe.name} description={t('fieldNameHint')}>
        <Input id="name" name="name" required />
      </FormField>

      <FormField id="icsUrl" label={t('fieldIcsUrl')} required error={fe.icsUrl}>
        <Input id="icsUrl" name="icsUrl" type="url" inputMode="url" required placeholder={t('fieldIcsUrlPlaceholder')} />
      </FormField>

      <FormField id="syncIntervalMin" label={t('fieldSyncInterval')} description={t('fieldSyncIntervalHint')} error={fe.syncIntervalMin}>
        <Input id="syncIntervalMin" name="syncIntervalMin" type="number" min={5} max={1440} defaultValue={60} />
      </FormField>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Link href="/admin/calendars"><Button variant="ghost" type="button">{t('cancelButton')}</Button></Link>
        <Button type="submit" disabled={pending}>{pending ? t('creating') : t('createButton')}</Button>
      </div>
    </form>
  );
}
