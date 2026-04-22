'use client';

import { Button } from '@/components/ui/button';

export function DeletePanel({ id, deleted }: { id: number; deleted: boolean }) {
  if (deleted) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Restore user</h2>
        <p className="mt-1 text-xs text-fg-muted">
          This user was soft-deleted. Restoring will re-enable sign-in.
        </p>
        <form action={`/admin/users/${id}/restore`} method="post" className="mt-5 flex justify-end">
          <Button type="submit" variant="secondary">Restore user</Button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
      <h2 className="text-sm font-semibold text-danger-700">Delete user</h2>
      <p className="mt-1 text-xs text-danger-700/80">
        Soft-delete. Historical data is preserved; active sessions are invalidated.
      </p>
      <form
        action={`/admin/users/${id}/delete`}
        method="post"
        className="mt-5 flex justify-end"
        onSubmit={(e) => {
          if (!confirm('Soft-delete this user?')) e.preventDefault();
        }}
      >
        <Button type="submit" variant="danger">Delete user</Button>
      </form>
    </section>
  );
}
