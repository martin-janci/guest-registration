'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wordmark } from '@/components/brand/wordmark';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark size={32} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-fg">Sign in</h1>
            <p className="mt-1 text-sm text-fg-muted">Admin and housekeeper access.</p>
          </div>

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
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
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-fg-subtle">
          Guest? Use the link your host sent you.
        </p>
      </div>
    </main>
  );
}
