import { Link } from '@/lib/i18n/link';
import { Plus, Receipt } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listInvoices } from '@/modules/invoices/service';
import { invoiceFiltersSchema } from '@/modules/invoices/schema';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function statusTone(s: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE') {
  if (s === 'PAID') return 'success' as const;
  if (s === 'SENT') return 'info' as const;
  if (s === 'OVERDUE') return 'danger' as const;
  return 'neutral' as const;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const parsed = invoiceFiltersSchema.safeParse({
    status: sp.status || undefined,
  });
  const rows = await listInvoices(admin.id, parsed.success ? parsed.data : {});

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Invoices</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Billing for stays, cleaning fees, deposits.
          </p>
        </div>
        <Link href="/admin/invoices/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New invoice</Button>
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Status</label>
          <Select name="status" defaultValue={sp.status ?? ''}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'num', header: 'Invoice #', render: (r) => (
            <Link href={`/admin/invoices/${r.id}`} className="font-mono font-medium text-fg hover:text-accent-700">
              {r.invoiceNumber}
            </Link>
          ) },
          { key: 'client', header: 'Client', render: (r) => <span className="text-fg">{r.clientName}</span> },
          { key: 'issued', header: 'Issued', render: (r) => <span className="text-fg-muted">{fmtDate(r.issueDate)}</span> },
          { key: 'due', header: 'Due', render: (r) => <span className="text-fg-muted">{r.dueDate ? fmtDate(r.dueDate) : '—'}</span> },
          { key: 'total', header: 'Total', align: 'right', render: (r) => (
            <span className="tabular-nums text-fg">{formatMoney(r.totalAmount.toFixed(2), r.currency)}</span>
          ) },
          { key: 'status', header: 'Status', render: (r) => <Pill tone={statusTone(r.status)}>{r.status.toLowerCase()}</Pill> },
          { key: 'actions', header: '', align: 'right', render: (r) => (
            <Link href={`/admin/invoices/${r.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Open
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Receipt className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No invoices yet. <Link href="/admin/invoices/new" className="text-accent-600">Create one</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
