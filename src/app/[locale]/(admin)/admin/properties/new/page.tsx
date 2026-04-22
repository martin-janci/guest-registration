'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { createPropertyAction } from './actions';
import { useTranslations } from 'next-intl';

export default function NewPropertyPage() {
  const [state, action, pending] = useActionState(createPropertyAction, undefined);
  const t = useTranslations('admin.properties.form');
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('newHeading')}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t('newSubheading')}
        </p>
      </header>

      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}

        <FormField id="name" label={t('fieldName')} required error={fe.name}>
          <Input id="name" name="name" autoComplete="off" required />
        </FormField>

        <FormField id="maxGuests" label={t('fieldMaxGuests')} description={t('fieldMaxGuestsHint')} error={fe.maxGuests}>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} />
        </FormField>

        <FormField id="notes" label={t('fieldNotes')} description={t('fieldNotesHint')} error={fe.notes}>
          <Textarea id="notes" name="notes" rows={3} />
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Link href="/admin/properties"><Button variant="ghost" type="button">{t('cancelButton')}</Button></Link>
          <Button type="submit" disabled={pending}>{pending ? t('creating') : t('createButton')}</Button>
        </div>
      </form>
    </div>
  );
}
