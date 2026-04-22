import { Link } from '@/lib/i18n/link';
import { ClipboardCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listRegistrations } from '@/modules/registrations/service';
import { registrationFiltersSchema } from '@/modules/registrations/schema';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';
import { getTranslations } from 'next-intl/server';

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
  const t = await getTranslations('admin.registrations');
  const tc = await getTranslations('admin.common');
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
            <option value="APPROVED">{t('status.APPROVED')}</option>
            <option value="REJECTED">{t('status.REJECTED')}</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">{tc('apply')}</Button>
      </form>

      <DataTable
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: 'trip', header: t('list.colTrip'), render: (r) => (
            <Link href={`/admin/registrations/${r.id}`} className="font-medium text-fg hover:text-accent-700">
              {r.trip.title}
            </Link>
          ) },
          { key: 'property', header: t('list.colProperty'), render: (r) => <span className="text-fg-muted">{r.trip.property.name}</span> },
          { key: 'email', header: t('list.colEmail'), render: (r) => <span className="text-fg">{r.email}</span> },
          { key: 'guests', header: t('list.colGuests'), align: 'right', render: (r) => <span className="tabular-nums text-fg">{r.guests.length}</span> },
          { key: 'submitted', header: t('list.colSubmitted'), render: (r) => <span className="text-xs text-fg-muted">{fmtSubmitted(r.submittedAt)}</span> },
          { key: 'status', header: t('list.colStatus'), render: (r) => <Pill tone={statusTone(r.status)}>{t(`status.${r.status}`)}</Pill> },
          { key: 'actions', header: '', align: 'right', render: (r) => (
            <Link href={`/admin/registrations/${r.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              {t('list.review')}
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <ClipboardCheck className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">{t('list.empty')}</p>
          </>
        }
      />
    </div>
  );
}
