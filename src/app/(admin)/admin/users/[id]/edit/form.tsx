'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { updateUserAction } from './actions';

interface Props {
  id: number;
  initial: { username: string; email: string; role: 'SUPERADMIN' | 'ADMIN' | 'HOUSEKEEPER' };
}

export function EditUserForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(
    updateUserAction.bind(null, id),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
      <h2 className="text-sm font-semibold text-fg">Profile</h2>
      <p className="mt-1 text-xs text-fg-muted">
        Username and email must be unique across the workspace.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-5">
        {state?.error && (
          <p className="rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}
        <FormField id="username" label="Username" required error={fe.username}>
          <Input id="username" name="username" defaultValue={initial.username} required />
        </FormField>
        <FormField id="email" label="Email" required error={fe.email}>
          <Input id="email" name="email" type="email" defaultValue={initial.email} required />
        </FormField>
        <FormField id="role" label="Role" required error={fe.role}>
          <Select id="role" name="role" defaultValue={initial.role}>
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="HOUSEKEEPER">Housekeeper</option>
          </Select>
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </section>
  );
}
