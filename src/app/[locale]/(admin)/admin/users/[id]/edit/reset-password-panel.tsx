'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { resetPasswordAction } from './actions';

export function ResetPasswordPanel({ id }: { id: number }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction.bind(null, id),
    undefined,
  );

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">Reset password</h2>
      <p className="mt-1 text-xs text-fg-muted">
        Type a new password or generate one. The user&apos;s current sessions are invalidated
        immediately.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-5">
        <FormField id="newPassword" label="New password" required error={state?.error}>
          <Input
            id="newPassword"
            name="newPassword"
            type="text"
            autoComplete="off"
            minLength={8}
            required
          />
        </FormField>

        {state?.newPassword && (
          <p className="rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700">
            Password updated. New password: <strong className="font-mono">{state.newPassword}</strong>
            <br />
            Share it with the user — this is the last time it will be shown.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? 'Updating…' : 'Set password'}
          </Button>
        </div>
      </form>
    </section>
  );
}
