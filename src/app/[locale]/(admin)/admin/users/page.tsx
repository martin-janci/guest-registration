import { Link } from '@/lib/i18n/link';
import { Plus, UserMinus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listUsers } from '@/modules/users/service';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string }>;
}

export default async function UsersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.users.list');
  const tCommon = await getTranslations('admin.common');
  await requireAdmin();
  const sp = await searchParams;
  const includeDeleted = sp.deleted === '1';
  const users = await listUsers({ includeDeleted });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('heading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t('subheading')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={includeDeleted ? '/admin/users' : '/admin/users?deleted=1'}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            {includeDeleted ? tCommon('hideDeleted') : tCommon('showDeleted')}
          </Link>
          <Link href="/admin/users/new">
            <Button size="md">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              {t('newButton')}
            </Button>
          </Link>
        </div>
      </header>

      <DataTable
        rowKey={(u) => u.id}
        rows={users}
        columns={[
          { key: 'username', header: t('colUsername'), render: (u) => (
            <span className="font-medium text-fg">{u.username}</span>
          ) },
          { key: 'email', header: t('colEmail'), render: (u) => <span className="text-fg-muted">{u.email}</span> },
          { key: 'role', header: t('colRole'), render: (u) => (
            <Pill tone={u.role === 'SUPERADMIN' ? 'accent' : u.role === 'ADMIN' ? 'info' : 'neutral'}>
              {u.role.toLowerCase()}
            </Pill>
          ) },
          { key: 'status', header: t('colStatus'), render: (u) => (
            u.deletedAt
              ? <Pill tone="danger">{t('statusDeleted')}</Pill>
              : <Pill tone="success">{t('statusActive')}</Pill>
          ) },
          { key: 'actions', header: '', align: 'right', render: (u) => (
            <Link
              href={`/admin/users/${u.id}/edit`}
              className="text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              {tCommon('edit')}
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <UserMinus className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              {t('empty')} <Link href="/admin/users/new" className="text-accent-600">{tCommon('addOne')}</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
