import Link from 'next/link';
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
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';

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

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [upcoming, pendingRegs, overdueCount, overdueInvoices] = await Promise.all([
    getUpcomingForAdmin(admin.id),
    listRegistrations({ status: 'PENDING' }),
    countOverdueForAdmin(admin.id, today),
    listInvoices(admin.id, { status: 'SENT' }),
  ]);

  const overdueAttention = overdueInvoices.filter((inv) => inv.dueDate && inv.dueDate.getTime() < today.getTime());

  const kpis = [
    { label: 'Arrivals this week', value: upcoming.length, icon: Plane },
    { label: 'Pending registrations', value: pendingRegs.length, icon: ClipboardCheck, tone: (pendingRegs.length > 0 ? 'warning' : 'neutral') as 'warning' | 'neutral' },
    { label: 'Unpaid housekeeping', value: 0, icon: Sparkles, delta: 'wires in M6', tone: 'neutral' as const },
    { label: 'Overdue invoices', value: overdueCount, icon: Receipt, tone: (overdueCount > 0 ? 'danger' : 'neutral') as 'danger' | 'neutral' },
  ];

  const attention: AttentionItem[] = [
    ...overdueAttention.slice(0, 3).map((inv) => ({
      icon: Receipt,
      tone: 'danger' as const,
      title: `Invoice ${inv.invoiceNumber} is overdue`,
      meta: `${inv.clientName} · ${formatMoney(inv.totalAmount.toFixed(2), inv.currency)}`,
      href: `/admin/invoices/${inv.id}`,
      action: 'Open',
    })),
    ...pendingRegs.slice(0, 5 - Math.min(overdueAttention.length, 3)).map((r) => ({
      icon: ClipboardCheck,
      tone: 'warning' as const,
      title: `${r.guests[0]?.firstName ?? 'A guest'} submitted a registration`,
      meta: `${r.trip.property.name} · ${shortWhen(r.submittedAt)}`,
      href: `/admin/registrations/${r.id}`,
      action: 'Review',
    })),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Welcome back, {admin.username}. Here&apos;s what&apos;s happening today.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            {...('delta' in k && k.delta ? { delta: k.delta } : {})}
            {...('tone' in k && k.tone ? { tone: k.tone } : {})}
            icon={k.icon}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <span className="text-xs text-fg-muted">{attention.length} items</span>
          </CardHeader>
          {attention.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <AlertCircle className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-sm text-fg-muted">Nothing to review right now.</p>
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
            <CardTitle>Arriving this week</CardTitle>
            <Link href="/admin/trips" className="text-xs font-medium text-accent-600 hover:text-accent-700">
              View all trips
            </Link>
          </CardHeader>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Plane className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-sm text-fg-muted">No arrivals in the next 7 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {['Trip', 'Property', 'Dates', 'Source', 'Guest'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((t, i) => (
                    <tr key={t.id} className={`${i < upcoming.length - 1 ? 'border-b border-border' : ''} hover:bg-surface-2`}>
                      <td className="px-4 py-3 font-medium text-fg">
                        <Link href={`/admin/trips/${t.id}`} className="hover:text-accent-700">{t.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-fg">{t.property.name}</td>
                      <td className="px-4 py-3 text-fg-muted">{fmtDate(t.startDate)} → {fmtDate(t.endDate)}</td>
                      <td className="px-4 py-3">
                        <Pill tone={t.source === 'MANUAL' ? 'neutral' : 'info'}>{t.source.toLowerCase()}</Pill>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{t.externalGuestName ?? '—'}</td>
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
