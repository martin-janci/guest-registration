'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { updateCalendarAction } from './actions';
import { useTranslations } from 'next-intl';

interface Props {
  id: number;
  initial: { name: string; icsUrl: string; syncIntervalMin: number };
}

export function EditCalendarForm({ id, initial }: Props) {
  const t = useTranslations('admin.calendars.form');
  const tDelete = useTranslations('admin.calendars.delete');
  const [state, action, pending] = useActionState(
    updateCalendarAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <FormField id="name" label={t('fieldName')} required error={fe.name}>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </FormField>
        <FormField id="icsUrl" label={t('fieldIcsUrl')} required error={fe.icsUrl}>
          <Input id="icsUrl" name="icsUrl" type="url" defaultValue={initial.icsUrl} required />
        </FormField>
        <FormField id="syncIntervalMin" label={t('fieldSyncInterval')} error={fe.syncIntervalMin}>
          <Input id="syncIntervalMin" name="syncIntervalMin" type="number" min={5} max={1440} defaultValue={initial.syncIntervalMin} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Link href="/admin/calendars"><Button variant="ghost" type="button">{t('cancelButton')}</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? t('saving') : t('saveButton')}</Button>
        </div>
      </form>

      <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
        <h2 className="text-sm font-semibold text-danger-700">{tDelete('heading')}</h2>
        <p className="mt-1 text-xs text-danger-700/80">
          {tDelete('body')}
        </p>
        <form
          action={`/admin/calendars/${id}/delete`}
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
