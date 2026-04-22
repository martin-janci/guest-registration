import { Link } from '@/lib/i18n/link';
import {
  AlertCircle,
  ClipboardCheck,
  Plane,
  Receipt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { getUpcomingForAdmin } from '@/modules/trips/service';
import { listRegistrations } from '@/modules/registrations/service';
import { listInvoices, countOverdueForAdmin } from '@/modules/invoices/service';
import { countUnpaidForAdmin } from '@/modules/housekeeping/service';
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface AttentionItem {
  icon: LucideIcon;
  tone: 'warning' | 'danger';
  title: string;
  meta: string;
  href: string;
  action: string;
}

function fmtDate(d: Date): string { return d.toISOString().slice(0, 10); }
function shortWhen(d: Date): string { return d.toISOString().replace('T', ' ').slice(5, 16); }

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.dashboard');
  const admin = await requireAdmin();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [upcoming, pendingRegs, overdueCount, overdueInvoices, unpaidHousekeeping] = await Promise.all([
    getUpcomingForAdmin(admin.id),
    listRegistrations({ status: 'PENDING' }),
    countOverdueForAdmin(admin.id, today),
    listInvoices(admin.id, { status: 'SENT' }),
    countUnpaidForAdmin(admin.id),
  ]);

  const overdueAttention = overdueInvoices.filter((inv) => inv.dueDate && inv.dueDate.getTime() < today.getTime());

  const kpis = [
    { label: t('kpi.arrivals'), value: upcoming.length, icon: Plane },
    { label: t('kpi.pendingRegistrations'), value: pendingRegs.length, icon: ClipboardCheck, tone: (pendingRegs.length > 0 ? 'warning' : 'neutral') as 'warning' | 'neutral' },
    { label: t('kpi.unpaidHousekeeping'), value: unpaidHousekeeping, icon: Sparkles, tone: (unpaidHousekeeping > 0 ? 'warning' : 'neutral') as 'warning' | 'neutral' },
    { label: t('kpi.overdueInvoices'), value: overdueCount, icon: Receipt, tone: (overdueCount > 0 ? 'danger' : 'neutral') as 'danger' | 'neutral' },
  ];

  const attention: AttentionItem[] = [
    ...overdueAttention.slice(0, 3).map((inv) => ({
      icon: Receipt,
      tone: 'danger' as const,
      title: t('attention.invoiceOverdue', { number: inv.invoiceNumber }),
      meta: `${inv.clientName} · ${formatMoney(inv.totalAmount.toFixed(2), inv.currency)}`,
      href: `/admin/invoices/${inv.id}`,
      action: t('attention.actionOpen'),
    })),
    ...pendingRegs.slice(0, 5 - Math.min(overdueAttention.length, 3)).map((r) => ({
      icon: ClipboardCheck,
      tone: 'warning' as const,
      title: t('attention.registrationSubmitted', { name: r.guests[0]?.firstName ?? 'A guest' }),
      meta: `${r.trip.property.name} · ${shortWhen(r.submittedAt)}`,
      href: `/admin/registrations/${r.id}`,
      action: t('attention.actionReview'),
    })),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('heading')}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t('welcome', { username: admin.username })}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const hasDelta = 'delta' in k && typeof k.delta === 'string';
          const hasTone = 'tone' in k && !!k.tone;
          const extras: { delta?: string; tone?: 'neutral' | 'warning' | 'danger' } = {};
          if (hasDelta) extras.delta = (k as { delta: string }).delta;
          if (hasTone) extras.tone = (k as { tone: 'neutral' | 'warning' | 'danger' }).tone;
          return (
            <KpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              icon={k.icon}
              {...extras}
            />
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('attention.heading')}</CardTitle>
            <span className="text-xs text-fg-muted">{t('attention.itemCount', { count: attention.length })}</span>
          </CardHeader>
          {attention.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <AlertCircle className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-sm text-fg-muted">{t('attention.empty')}</p>
            </div>
          ) : (
            <ul>
              {attention.map((it, i) => {
                const Icon = it.icon;
                const bg = it.tone === 'danger' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700';
                return (
                  <li key={i} className={`flex items-center gap-3 px-4 py-3 ${i < attention.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bg}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-fg">{it.title}</div>
                      <div className="truncate text-xs text-fg-muted">{it.meta}</div>
                    </div>
                    <Link href={it.href}>
                      <Button variant="secondary" size="sm">{it.action}</Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('arrivals.heading')}</CardTitle>
            <Link href="/admin/trips" className="text-xs font-medium text-accent-600 hover:text-accent-700">
              {t('arrivals.viewAll')}
            </Link>
          </CardHeader>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Plane className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-sm text-fg-muted">{t('arrivals.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {([t('arrivals.colTrip'), t('arrivals.colProperty'), t('arrivals.colDates'), t('arrivals.colSource'), t('arrivals.colGuest')] as string[]).map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((trip, i) => (
                    <tr key={trip.id} className={`${i < upcoming.length - 1 ? 'border-b border-border' : ''} hover:bg-surface-2`}>
                      <td className="px-4 py-3 font-medium text-fg">
                        <Link href={`/admin/trips/${trip.id}`} className="hover:text-accent-700">{trip.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-fg">{trip.property.name}</td>
                      <td className="px-4 py-3 text-fg-muted">{fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}</td>
                      <td className="px-4 py-3">
                        <Pill tone={trip.source === 'MANUAL' ? 'neutral' : 'info'}>{trip.source.toLowerCase()}</Pill>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{trip.externalGuestName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
