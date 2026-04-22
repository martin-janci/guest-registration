import { Link } from '@/lib/i18n/link';
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
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
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

export default async function TripsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.trips.list');
  const tCommon = await getTranslations('admin.common');
  const admin = await requireAdmin();
  const sp = await searchParams;
  const parsed = tripFiltersSchema.safeParse({
    propertyId: sp.propertyId ?? undefined,
    source: sp.source ?? undefined,
    from: sp.from ?? undefined,
    to: sp.to ?? undefined,
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
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('heading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t('subheading')}
          </p>
        </div>
        <Link href="/admin/trips/new">
          <Button><Plus className="h-4 w-4" strokeWidth={1.75} />{t('newButton')}</Button>
        </Link>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('filterProperty')}</label>
          <Select name="propertyId" defaultValue={sp.propertyId?.toString() ?? ''}>
            <option value="">{t('filterAll')}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('filterSource')}</label>
          <Select name="source" defaultValue={sp.source?.toString() ?? ''}>
            <option value="">{t('filterAll')}</option>
            <option value="MANUAL">{t('filterManual')}</option>
            <option value="AIRBNB_ICS">{t('filterAirbnb')}</option>
            <option value="WEBHOOK">{t('filterWebhook')}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('filterFrom')}</label>
          <Input name="from" type="date" defaultValue={sp.from?.toString() ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg">{t('filterTo')}</label>
          <Input name="to" type="date" defaultValue={sp.to?.toString() ?? ''} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="includePast" value="1" defaultChecked={sp.includePast === '1'} className="h-4 w-4 rounded border-border accent-accent-500" />
          {t('filterIncludePast')}
        </label>
        <Button type="submit" variant="secondary">{t('filterApply')}</Button>
      </form>

      <DataTable
        rowKey={(trip) => trip.id}
        rows={trips}
        columns={[
          { key: 'title', header: t('colTitle'), render: (trip) => (
            <Link href={`/admin/trips/${trip.id}`} className="font-medium text-fg hover:text-accent-700">
              {trip.title}
            </Link>
          ) },
          { key: 'property', header: t('colProperty'), render: (trip) => <span className="text-fg-muted">{trip.property.name}</span> },
          { key: 'dates', header: t('colDates'), render: (trip) => (
            <span className="text-fg">{fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}</span>
          ) },
          { key: 'source', header: t('colSource'), render: (trip) => <Pill tone={pillToneForSource(trip.source)}>{trip.source.toLowerCase()}</Pill> },
          { key: 'guest', header: t('colGuest'), render: (trip) => (
            <span className="text-fg-muted">{trip.externalGuestName ?? '—'}</span>
          ) },
          { key: 'actions', header: '', align: 'right', render: (trip) => (
            <Link href={`/admin/trips/${trip.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              {tCommon('open')}
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Plane className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              {t('empty')} <Link href="/admin/trips/new" className="text-accent-600">{t('emptyAddManually')}</Link> {t('emptyOrSync')}
            </p>
          </>
        }
      />
    </div>
  );
}
