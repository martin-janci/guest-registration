'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { createUserAction, type CreateUserState } from './actions';

export default function NewUserPage() {
  const [state, action, pending] = useActionState<CreateUserState | undefined, FormData>(
    createUserAction,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">New user</h1>
        <p className="mt-1 text-sm text-fg-muted">
          The new user will be able to sign in immediately using the password you set.
        </p>
      </header>

      <form action={action} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}

        <FormField id="username" label="Username" required error={fe.username}>
          <Input id="username" name="username" autoComplete="off" required />
        </FormField>

        <FormField id="email" label="Email" required error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="off" required />
        </FormField>

        <FormField id="password" label="Password" description="Minimum 8 characters." required error={fe.password}>
          <Input id="password" name="password" type="text" autoComplete="new-password" required />
        </FormField>

        <FormField id="role" label="Role" required error={fe.role}>
          <Select id="role" name="role" defaultValue="ADMIN">
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="HOUSEKEEPER">Housekeeper</option>
          </Select>
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Link href="/admin/users">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create user'}
          </Button>
        </div>
      </form>
    </div>
  );
}
