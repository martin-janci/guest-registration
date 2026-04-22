import Link from 'next/link';
import { Plane, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listTrips } from '@/modules/trips/service';
import { tripFiltersSchema } from '@/modules/trips/schema';
import { listProperties } from '@/modules/properties/service';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function pillToneForSource(s: string) {
  if (s === 'AIRBNB_ICS') return 'info' as const;
  if (s === 'WEBHOOK') return 'accent' as const;
  return 'neutral' as const;
}

export default async function TripsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const parsed = tripFiltersSchema.safeParse({
    propertyId: sp.propertyId ?? undefined,
    source: sp.source ?? undefined,
    from: sp.from ?? undefined,
    to: sp.to ?? undefined,
    // z.coerce.boolean() coerces any non-empty string (including 'false') to true,
    // so we pass undefined when the checkbox is not checked (sp.includePast is undefined)
    // and 'true' when it is checked (sp.includePast === '1').
    includePast: sp.includePast === '1' ? 'true' : undefined,
  });
  const filters = parsed.success ? parsed.data : { includePast: false };

  const [trips, properties] = await Promise.all([
    listTrips(admin.id, filters),
    listProperties(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Trips</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Reservations — manual and imported from Airbnb.
          </p>
        </div>
        <Link href="/admin/trips/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New trip</Button>
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Property</label>
          <Select name="propertyId" defaultValue={sp.propertyId?.toString() ?? ''}>
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">Source</label>
          <Select name="source" defaultValue={sp.source?.toString() ?? ''}>
            <option value="">All</option>
            <option value="MANUAL">Manual</option>
            <option value="AIRBNB_ICS">Airbnb</option>
            <option value="WEBHOOK">Webhook</option>
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
          <input type="checkbox" name="includePast" value="1" defaultChecked={sp.includePast === '1'} className="h-4 w-4 rounded border-border accent-accent-500" />
          Include past
        </label>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      <DataTable
        rowKey={(t) => t.id}
        rows={trips}
        columns={[
          { key: 'title', header: 'Title', render: (t) => (
            <Link href={`/admin/trips/${t.id}`} className="font-medium text-fg hover:text-accent-700">
              {t.title}
            </Link>
          ) },
          { key: 'property', header: 'Property', render: (t) => <span className="text-fg-muted">{t.property.name}</span> },
          { key: 'dates', header: 'Dates', render: (t) => (
            <span className="text-fg">{fmtDate(t.startDate)} → {fmtDate(t.endDate)}</span>
          ) },
          { key: 'source', header: 'Source', render: (t) => <Pill tone={pillToneForSource(t.source)}>{t.source.toLowerCase()}</Pill> },
          { key: 'guest', header: 'Guest', render: (t) => (
            <span className="text-fg-muted">{t.externalGuestName ?? '—'}</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (t) => (
            <Link href={`/admin/trips/${t.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Open
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Plane className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No trips match these filters. <Link href="/admin/trips/new" className="text-accent-600">Add manually</Link> or sync a calendar.
            </p>
          </>
        }
      />
    </div>
  );
}
