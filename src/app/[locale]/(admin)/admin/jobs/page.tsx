import { Link } from '@/lib/i18n/link';
import { CircleDot, RefreshCw } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listJobs } from '@/modules/jobs/service';
import { jobFiltersSchema } from '@/modules/jobs/schema';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string; kind?: string }>;
}

function statusTone(s: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED') {
  if (s === 'DONE') return 'success' as const;
  if (s === 'RUNNING') return 'info' as const;
  if (s === 'FAILED') return 'danger' as const;
  return 'neutral' as const;
}

function fmt(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export default async function JobsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const t = await getTranslations('admin.jobs');
  const tc = await getTranslations('admin.common');
  const sp = await searchParams;
  const parsed = jobFiltersSchema.safeParse({
    status: sp.status || undefined,
    kind: sp.kind || undefined,
  });
  const rows = await listJobs(parsed.success ? parsed.data : {});

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('list.heading')}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t('list.subheading')}
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('list.filterStatus')}</label>
          <Select name="status" defaultValue={sp.status ?? ''}>
            <option value="">{t('list.filterAll')}</option>
            <option value="PENDING">{t('status.PENDING')}</option>
            <option value="RUNNING">{t('status.RUNNING')}</option>
            <option value="DONE">{t('status.DONE')}</option>
            <option value="FAILED">{t('status.FAILED')}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('list.filterKind')}</label>
          <Select name="kind" defaultValue={sp.kind ?? ''}>
            <option value="">{t('list.filterAll')}</option>
            <option value="AIRBNB_SYNC">{t('kind.AIRBNB_SYNC')}</option>
            <option value="INVOICE_OVERDUE_FLIP">{t('kind.INVOICE_OVERDUE_FLIP')}</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">{tc('apply')}</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'id', header: t('list.colId'), render: (j) => <span className="font-mono text-xs text-fg-muted">{j.id}</span> },
          { key: 'kind', header: t('list.colKind'), render: (j) => <span className="text-fg">{t(`kind.${j.kind}`)}</span> },
          { key: 'status', header: t('list.colStatus'), render: (j) => <Pill tone={statusTone(j.status)}>{t(`status.${j.status}`)}</Pill> },
          { key: 'attempts', header: t('list.colAttempts'), align: 'right', render: (j) => <span className="tabular-nums text-fg">{j.attempts}</span> },
          { key: 'runAfter', header: t('list.colRunAfter'), render: (j) => <span className="text-xs text-fg-muted">{fmt(j.runAfter)}</span> },
          { key: 'error', header: t('list.colLastError'), render: (j) => (
            j.lastError ? <span className="line-clamp-2 max-w-xs text-xs text-danger-700">{j.lastError}</span> : <span className="text-xs text-fg-subtle">—</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (j) => (
            j.status === 'FAILED' ? (
              <form action={`/admin/jobs/${j.id}/retry`} method="post">
                <button type="submit" className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t('list.retry')}
                </button>
              </form>
            ) : null
          ) },
        ]}
        emptyState={<><CircleDot className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} /><p className="text-sm text-fg-muted">{t('list.empty')}</p></>}
      />
    </div>
  );
}
