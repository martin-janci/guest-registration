import { Link } from '@/lib/i18n/link';
import { CircleDot, RefreshCw } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listJobs } from '@/modules/jobs/service';
import { jobFiltersSchema } from '@/modules/jobs/schema';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

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
  const sp = await searchParams;
  const parsed = jobFiltersSchema.safeParse({
    status: sp.status || undefined,
    kind: sp.kind || undefined,
  });
  const rows = await listJobs(parsed.success ? parsed.data : {});

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Jobs</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Background work — Airbnb syncs + daily overdue flip. Most recent first (last 200).
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Status</label>
          <Select name="status" defaultValue={sp.status ?? ''}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="DONE">Done</option>
            <option value="FAILED">Failed</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Kind</label>
          <Select name="kind" defaultValue={sp.kind ?? ''}>
            <option value="">All</option>
            <option value="AIRBNB_SYNC">Airbnb sync</option>
            <option value="INVOICE_OVERDUE_FLIP">Invoice overdue flip</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'id', header: '#', render: (j) => <span className="font-mono text-xs text-fg-muted">{j.id}</span> },
          { key: 'kind', header: 'Kind', render: (j) => <span className="text-fg">{j.kind.toLowerCase().replace(/_/g, ' ')}</span> },
          { key: 'status', header: 'Status', render: (j) => <Pill tone={statusTone(j.status)}>{j.status.toLowerCase()}</Pill> },
          { key: 'attempts', header: 'Attempts', align: 'right', render: (j) => <span className="tabular-nums text-fg">{j.attempts}</span> },
          { key: 'runAfter', header: 'Run after', render: (j) => <span className="text-xs text-fg-muted">{fmt(j.runAfter)}</span> },
          { key: 'error', header: 'Last error', render: (j) => (
            j.lastError ? <span className="line-clamp-2 max-w-xs text-xs text-danger-700">{j.lastError}</span> : <span className="text-xs text-fg-subtle">—</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (j) => (
            j.status === 'FAILED' ? (
              <form action={`/admin/jobs/${j.id}/retry`} method="post">
                <button type="submit" className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Retry
                </button>
              </form>
            ) : null
          ) },
        ]}
        emptyState={<><CircleDot className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} /><p className="text-sm text-fg-muted">No jobs yet.</p></>}
      />
    </div>
  );
}
