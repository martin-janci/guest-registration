import Link from 'next/link';
import { Calendar as CalIcon, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listCalendars } from '@/modules/calendars/service';
import { popFlash } from '@/lib/flash';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

function formatWhen(d: Date | null): string {
  if (!d) return 'never';
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export default async function CalendarsPage() {
  await requireAdmin();
  const rows = await listCalendars();
  const flash = await popFlash();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Calendars</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Airbnb ics feeds. Import runs when you click Sync.
          </p>
        </div>
        <Link href="/admin/calendars/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New calendar</Button>
        </Link>
      </header>

      {flash && (
        <p
          className={
            flash.kind === 'success'
              ? 'rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700'
              : 'rounded-md border border-danger-100 bg-danger-100 px-3 py-2 text-sm text-danger-700'
          }
        >
          {flash.message}
        </p>
      )}

      <DataTable
        rowKey={(c) => c.id}
        rows={rows}
        columns={[
          { key: 'property', header: 'Property', render: (c) => (
            <Link href={`/admin/properties/${c.property.id}`} className="font-medium text-fg hover:text-accent-700">
              {c.property.name}
            </Link>
          ) },
          { key: 'name', header: 'Name', render: (c) => <span className="text-fg">{c.name}</span> },
          { key: 'lastSync', header: 'Last sync', render: (c) => (
            c.lastSyncError
              ? <Pill tone="danger">{c.lastSyncError}</Pill>
              : <span className="text-fg-muted text-xs">{formatWhen(c.lastSyncedAt)}</span>
          ) },
          { key: 'interval', header: 'Interval', align: 'right', render: (c) => (
            <span className="tabular-nums text-fg">{c.syncIntervalMin} min</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (c) => (
            <div className="flex items-center justify-end gap-3">
              <form action={`/admin/calendars/${c.id}/sync`} method="post">
                <button type="submit" className="text-sm font-medium text-accent-600 hover:text-accent-700">
                  Sync now
                </button>
              </form>
              <Link href={`/admin/calendars/${c.id}/edit`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
                Edit
              </Link>
            </div>
          ) },
        ]}
        emptyState={
          <>
            <CalIcon className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No calendars yet. <Link href="/admin/calendars/new" className="text-accent-600">Add one</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
