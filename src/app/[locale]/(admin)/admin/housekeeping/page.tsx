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
import { getTranslations } from 'next-intl/server';

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
  const t = await getTranslations('admin.housekeeping');
  const tc = await getTranslations('admin.common');
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
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('list.heading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t('list.subheading')}
          </p>
        </div>
        <Link href="/admin/housekeeping/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />{t('list.newButton')}</Button>
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('list.filterStatus')}</label>
          <Select name="status" defaultValue={sp.status?.toString() ?? ''}>
            <option value="">{t('list.filterAll')}</option>
            <option value="PENDING">{t('status.PENDING')}</option>
            <option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option>
            <option value="COMPLETED">{t('status.COMPLETED')}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('list.filterHousekeeper')}</label>
          <Select name="housekeeperId" defaultValue={sp.housekeeperId?.toString() ?? ''}>
            <option value="">{t('list.filterAll')}</option>
            {housekeepers.map((h) => (<option key={h.id} value={h.id}>{h.username}</option>))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('list.filterFrom')}</label>
          <Input name="from" type="date" defaultValue={sp.from?.toString() ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('list.filterTo')}</label>
          <Input name="to" type="date" defaultValue={sp.to?.toString() ?? ''} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="unpaidOnly" value="1" defaultChecked={sp.unpaidOnly === '1'} className="h-4 w-4 rounded border-border accent-accent-500" />
          {t('list.filterUnpaidOnly')}
        </label>
        <Button type="submit" variant="secondary">{tc('apply')}</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'date', header: t('list.colDate'), render: (task) => (
            <Link href={`/admin/housekeeping/${task.id}`} className="font-medium text-fg hover:text-accent-700">
              {fmtDate(task.date)}
            </Link>
          ) },
          { key: 'property', header: t('list.colProperty'), render: (task) => <span className="text-fg">{task.trip.property.name}</span> },
          { key: 'housekeeper', header: t('list.colHousekeeper'), render: (task) => <span className="text-fg-muted">{task.housekeeper.username}</span> },
          { key: 'pay', header: t('list.colPay'), align: 'right', render: (task) => (
            <span className="tabular-nums text-fg">{formatMoney(task.payAmount.toFixed(2), 'EUR')}</span>
          ) },
          { key: 'status', header: t('list.colStatus'), render: (task) => <Pill tone={statusTone(task.status)}>{t(`status.${task.status}`)}</Pill> },
          { key: 'paid', header: t('list.colPaid'), render: (task) => task.paid ? <Pill tone="success">{t('list.paid')}</Pill> : <Pill tone="neutral">{t('list.unpaid')}</Pill> },
          { key: 'actions', header: '', align: 'right', render: (task) => (
            <Link href={`/admin/housekeeping/${task.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">{tc('open')}</Link>
          ) },
        ]}
        emptyState={<><Sparkles className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} /><p className="text-sm text-fg-muted">{t('list.empty')}</p></>}
      />
    </div>
  );
}
