import { Link } from '@/lib/i18n/link';
import { Home, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string }>;
}

export default async function PropertiesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.properties.list');
  const tCommon = await getTranslations('admin.common');
  await requireAdmin();
  const sp = await searchParams;
  const includeDeleted = sp.deleted === '1';
  const rows = await listProperties({ includeDeleted });

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
            href={includeDeleted ? '/admin/properties' : '/admin/properties?deleted=1'}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            {includeDeleted ? tCommon('hideDeleted') : tCommon('showDeleted')}
          </Link>
          <Link href="/admin/properties/new">
            <Button><Plus className="h-4 w-4" strokeWidth={1.75} />{t('newButton')}</Button>
          </Link>
        </div>
      </header>

      <DataTable
        rowKey={(p) => p.id}
        rows={rows}
        columns={[
          { key: 'name', header: t('colName'), render: (p) => (
            <Link href={`/admin/properties/${p.id}`} className="font-medium text-fg hover:text-accent-700">
              {p.name}
            </Link>
          ) },
          { key: 'owner', header: t('colOwner'), render: (p) => (
            <span className="text-fg-muted">{p.owner.username}</span>
          ) },
          { key: 'maxGuests', header: t('colMaxGuests'), align: 'right', render: (p) => (
            <span className="tabular-nums text-fg">{p.maxGuests ?? '—'}</span>
          ) },
          { key: 'status', header: t('colStatus'), render: (p) => (
            p.deletedAt ? <Pill tone="danger">{t('statusDeleted')}</Pill> : <Pill tone="success">{t('statusActive')}</Pill>
          ) },
          { key: 'actions', header: '', align: 'right', render: (p) => (
            <Link href={`/admin/properties/${p.id}/edit`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              {tCommon('edit')}
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Home className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              {t('empty')} <Link href="/admin/properties/new" className="text-accent-600">{tCommon('addOne')}</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
