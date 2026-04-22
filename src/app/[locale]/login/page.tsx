'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wordmark } from '@/components/brand/wordmark';
import { loginAction } from './actions';
import { useTranslations } from 'next-intl';
import { LangSwitch } from '@/components/ui/lang-switch';

export default function LoginPage() {
  const t = useTranslations('login');
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <LangSwitch />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark size={32} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-fg">{t('heading')}</h1>
            <p className="mt-1 text-sm text-fg-muted">{t('subheading')}</p>
          </div>

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{t('username')}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {state?.error && (
              <p className="text-sm text-danger-700" role="alert">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? t('submitting') : t('submit')}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-fg-subtle">
          {t('guestHint')}
        </p>
      </div>
    </main>
  );
}
