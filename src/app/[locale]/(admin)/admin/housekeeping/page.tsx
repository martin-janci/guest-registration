import { Link } from '@/lib/i18n/link';
import { Plus, Sparkles } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listTasksForAdmin } from '@/modules/housekeeping/service';
import { taskFiltersSchema } from '@/modules/housekeeping/schema';
import { listUsers } from '@/modules/users/service';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function statusTone(s: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') {
  if (s === 'COMPLETED') return 'success' as const;
  if (s === 'IN_PROGRESS') return 'info' as const;
  return 'warning' as const;
}
function fmtDate(d: Date): string { return d.toISOString().slice(0, 10); }

export default async function HousekeepingPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const parsed = taskFiltersSchema.safeParse({
    status: sp.status ?? undefined,
    housekeeperId: sp.housekeeperId ?? undefined,
    from: sp.from ?? undefined,
    to: sp.to ?? undefined,
    unpaidOnly: sp.unpaidOnly === '1' ? 'true' : undefined,
  });
  const filters = parsed.success ? parsed.data : {};
  const [rows, allUsers] = await Promise.all([
    listTasksForAdmin(admin.id, filters),
    listUsers(),
  ]);
  const housekeepers = allUsers.filter((u) => u.role === 'HOUSEKEEPER' && !u.deletedAt);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Housekeeping</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Cleaning tasks auto-created per reservation + manual add.
          </p>
        </div>
        <Link href="/admin/housekeeping/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New task</Button>
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Status</label>
          <Select name="status" defaultValue={sp.status?.toString() ?? ''}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Housekeeper</label>
          <Select name="housekeeperId" defaultValue={sp.housekeeperId?.toString() ?? ''}>
            <option value="">All</option>
            {housekeepers.map((h) => (<option key={h.id} value={h.id}>{h.username}</option>))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">From</label>
          <Input name="from" type="date" defaultValue={sp.from?.toString() ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">To</label>
          <Input name="to" type="date" defaultValue={sp.to?.toString() ?? ''} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="unpaidOnly" value="1" defaultChecked={sp.unpaidOnly === '1'} className="h-4 w-4 rounded border-border accent-accent-500" />
          Unpaid only
        </label>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'date', header: 'Date', render: (t) => (
            <Link href={`/admin/housekeeping/${t.id}`} className="font-medium text-fg hover:text-accent-700">
              {fmtDate(t.date)}
            </Link>
          ) },
          { key: 'property', header: 'Property', render: (t) => <span className="text-fg">{t.trip.property.name}</span> },
          { key: 'housekeeper', header: 'Housekeeper', render: (t) => <span className="text-fg-muted">{t.housekeeper.username}</span> },
          { key: 'pay', header: 'Pay', align: 'right', render: (t) => (
            <span className="tabular-nums text-fg">{formatMoney(t.payAmount.toFixed(2), 'EUR')}</span>
          ) },
          { key: 'status', header: 'Status', render: (t) => <Pill tone={statusTone(t.status)}>{t.status.toLowerCase().replace('_', ' ')}</Pill> },
          { key: 'paid', header: 'Paid', render: (t) => t.paid ? <Pill tone="success">paid</Pill> : <Pill tone="neutral">unpaid</Pill> },
          { key: 'actions', header: '', align: 'right', render: (t) => (
            <Link href={`/admin/housekeeping/${t.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">Open</Link>
          ) },
        ]}
        emptyState={<><Sparkles className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} /><p className="text-sm text-fg-muted">No tasks match these filters.</p></>}
      />
    </div>
  );
}
