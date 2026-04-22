'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function DeletePanel({ id, deleted }: { id: number; deleted: boolean }) {
  const tDelete = useTranslations('admin.users.delete');
  const tRestore = useTranslations('admin.users.restore');

  if (deleted) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">{tRestore('heading')}</h2>
        <p className="mt-1 text-xs text-fg-muted">
          {tRestore('body')}
        </p>
        <form action={`/admin/users/${id}/restore`} method="post" className="mt-5 flex justify-end">
          <Button type="submit" variant="secondary">{tRestore('button')}</Button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-danger-100 bg-danger-100 p-6">
      <h2 className="text-sm font-semibold text-danger-700">{tDelete('heading')}</h2>
      <p className="mt-1 text-xs text-danger-700/80">
        {tDelete('body')}
      </p>
      <form
        action={`/admin/users/${id}/delete`}
        method="post"
        className="mt-5 flex justify-end"
        onSubmit={(e) => {
          if (!confirm(tDelete('confirm'))) e.preventDefault();
        }}
      >
        <Button type="submit" variant="danger">{tDelete('button')}</Button>
      </form>
    </section>
  );
}
