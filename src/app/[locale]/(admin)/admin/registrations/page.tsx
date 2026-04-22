import { Link } from '@/lib/i18n/link';
import { ClipboardCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listRegistrations } from '@/modules/registrations/service';
import { registrationFiltersSchema } from '@/modules/registrations/schema';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string; tripId?: string }>;
}

function statusTone(s: 'PENDING' | 'APPROVED' | 'REJECTED') {
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'REJECTED') return 'danger' as const;
  return 'warning' as const;
}

function fmtSubmitted(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export default async function RegistrationsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const parsed = registrationFiltersSchema.safeParse({
    status: sp.status || undefined,
    tripId: sp.tripId || undefined,
  });
  const filters = parsed.success ? parsed.data : {};
  const rows = await listRegistrations(filters);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Registrations</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Guest submissions waiting for review.
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Status</label>
          <Select name="status" defaultValue={sp.status ?? ''}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'trip', header: 'Trip', render: (r) => (
            <Link href={`/admin/registrations/${r.id}`} className="font-medium text-fg hover:text-accent-700">
              {r.trip.title}
            </Link>
          ) },
          { key: 'property', header: 'Property', render: (r) => <span className="text-fg-muted">{r.trip.property.name}</span> },
          { key: 'email', header: 'Contact email', render: (r) => <span className="text-fg">{r.email}</span> },
          { key: 'guests', header: 'Guests', align: 'right', render: (r) => <span className="tabular-nums text-fg">{r.guests.length}</span> },
          { key: 'submitted', header: 'Submitted', render: (r) => <span className="text-xs text-fg-muted">{fmtSubmitted(r.submittedAt)}</span> },
          { key: 'status', header: 'Status', render: (r) => <Pill tone={statusTone(r.status)}>{r.status.toLowerCase()}</Pill> },
          { key: 'actions', header: '', align: 'right', render: (r) => (
            <Link href={`/admin/registrations/${r.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Review
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <ClipboardCheck className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">No registrations match these filters yet.</p>
          </>
        }
      />
    </div>
  );
}
