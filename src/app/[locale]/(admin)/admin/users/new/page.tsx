'use client';

import { useActionState } from 'react';
import { Link } from '@/lib/i18n/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createUserAction, type CreateUserState } from './actions';
import { useTranslations } from 'next-intl';

export default function NewUserPage() {
  const [state, action, pending] = useActionState<CreateUserState | undefined, FormData>(
    createUserAction,
    undefined,
  );
  const t = useTranslations('admin.users.form');
  const tRole = useTranslations('admin.users.role');
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

        <FormField id="username" label={t('fieldUsername')} required error={fe.username}>
          <Input id="username" name="username" autoComplete="off" required />
        </FormField>

        <FormField id="email" label={t('fieldEmail')} required error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="off" required />
        </FormField>

        <FormField id="password" label={t('fieldPassword')} description={t('fieldPasswordHint')} required error={fe.password}>
          <Input id="password" name="password" type="text" autoComplete="new-password" required />
        </FormField>

        <FormField id="role" label={t('fieldRole')} required error={fe.role}>
          <Select id="role" name="role" defaultValue="ADMIN">
            <option value="ADMIN">{tRole('ADMIN')}</option>
            <option value="SUPERADMIN">{tRole('SUPERADMIN')}</option>
            <option value="HOUSEKEEPER">{tRole('HOUSEKEEPER')}</option>
          </Select>
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Link href="/admin/users">
            <Button variant="ghost" type="button">{t('cancelButton')}</Button>
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? t('creating') : t('createButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
