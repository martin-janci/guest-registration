'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { updateUserAction } from './actions';
import { useTranslations } from 'next-intl';

interface Props {
  id: number;
  initial: { username: string; email: string; role: 'SUPERADMIN' | 'ADMIN' | 'HOUSEKEEPER' };
}

export function EditUserForm({ id, initial }: Props) {
  const t = useTranslations('admin.users.form');
  const tRole = useTranslations('admin.users.role');
  const [state, action, pending] = useActionState(
    updateUserAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">{t('profileHeading')}</h2>
      <p className="mt-1 text-xs text-fg-muted">
        {t('profileHint')}
      </p>

      <form action={action} className="mt-5 flex flex-col gap-5">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}
        <FormField id="username" label={t('fieldUsername')} required error={fe.username}>
          <Input id="username" name="username" defaultValue={initial.username} required />
        </FormField>
        <FormField id="email" label={t('fieldEmail')} required error={fe.email}>
          <Input id="email" name="email" type="email" defaultValue={initial.email} required />
        </FormField>
        <FormField id="role" label={t('fieldRole')} required error={fe.role}>
          <Select id="role" name="role" defaultValue={initial.role}>
            <option value="ADMIN">{tRole('ADMIN')}</option>
            <option value="SUPERADMIN">{tRole('SUPERADMIN')}</option>
            <option value="HOUSEKEEPER">{tRole('HOUSEKEEPER')}</option>
          </Select>
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? t('saving') : t('saveButton')}
          </Button>
        </div>
      </form>
    </section>
  );
}
