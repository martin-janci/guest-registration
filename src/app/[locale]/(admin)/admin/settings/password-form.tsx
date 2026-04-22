'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { changePasswordAction } from './actions';
import { useTranslations } from 'next-intl';

export function PasswordForm() {
  const t = useTranslations('admin.settings.password');
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">{t('heading')}</h2>

      {state?.saved && (
        <p className="rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700">
          {t('saved')}
        </p>
      )}
      {state?.error && (
        <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}

      <FormField id="currentPassword" label={t('fieldCurrent')} required>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </FormField>
      <FormField id="newPassword" label={t('fieldNew')} description={t('fieldNewHint')} required>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? t('updating') : t('changeButton')}</Button>
      </div>
    </form>
  );
}
