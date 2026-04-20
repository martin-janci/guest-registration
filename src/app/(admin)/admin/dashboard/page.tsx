import {
  AlertCircle,
  ClipboardCheck,
  Plane,
  Receipt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentSession } from '@/modules/auth/current';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';

// M1: placeholder data. Real counts come from Prisma in M2+.
const kpis = [
  { label: 'Arrivals this week', value: 7, icon: Plane },
  { label: 'Pending registrations', value: 3, delta: '2 new today', tone: 'warning' as const, icon: ClipboardCheck },
  { label: 'Unpaid housekeeping', value: 2, icon: Sparkles },
  { label: 'Overdue invoices', value: 1, delta: '€ 420,00', tone: 'danger' as const, icon: Receipt },
];

interface AttentionItem {
  icon: LucideIcon;
  tone: 'warning' | 'danger';
  title: string;
  meta: string;
  action: string;
}

const attention: AttentionItem[] = [
  {
    icon: ClipboardCheck,
    tone: 'warning',
    title: 'Anna Novotná submitted registration',
    meta: 'Tatranská Perla · 14:32',
    action: 'Review',
  },
  {
    icon: ClipboardCheck,
    tone: 'warning',
    title: 'Lukas Müller submitted registration',
    meta: 'Donovaly Cottage · 09:08',
    action: 'Review',
  },
  {
    icon: AlertCircle,
    tone: 'danger',
    title: 'Airbnb sync failed for Tatranská Perla',
    meta: 'Last success 14:03 · HTTP 503',
    action: 'Retry',
  },
  {
    icon: Receipt,
    tone: 'danger',
    title: 'Invoice 2026-0041 is overdue',
    meta: '€ 420,00 · Müller GmbH · 8 days',
    action: 'Remind',
  },
];

const trips = [
  {
    title: 'Tatranská Perla — Apt 2B',
    guest: 'Novotná, Anna',
    dates: '22–26 Apr',
    source: 'Airbnb',
    status: 'warning' as const,
    statusLabel: 'Awaiting reg',
  },
  {
    title: 'Donovaly Cottage',
    guest: 'Müller, Lukas',
    dates: '23–25 Apr',
    source: 'Airbnb',
    status: 'success' as const,
    statusLabel: 'Registered',
  },
  {
    title: 'Bratislava Loft',
    guest: 'Dvořák, Tomáš',
    dates: '24 Apr – 2 May',
    source: 'Manual',
    status: 'success' as const,
    statusLabel: 'Registered',
  },
  {
    title: 'Tatranská Perla — Apt 1A',
    guest: '—',
    dates: '26–28 Apr',
    source: 'Airbnb',
    status: 'neutral' as const,
    statusLabel: 'No guest info',
  },
];

export default async function DashboardPage() {
  const { user } = await getCurrentSession();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Welcome back, {user?.username}. Here&apos;s what&apos;s happening today.
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
          <ul>
            {attention.map((it, i) => {
              const Icon = it.icon;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < attention.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      it.tone === 'danger'
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{it.title}</div>
                    <div className="truncate text-xs text-fg-muted">{it.meta}</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    {it.action}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Arriving this week</CardTitle>
            <a
              href="/admin/trips"
              className="text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              View all trips
            </a>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {['Trip', 'Guest', 'Dates', 'Source', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((r, i) => (
                  <tr
                    key={i}
                    className={`${
                      i < trips.length - 1 ? 'border-b border-border' : ''
                    } hover:bg-surface-2`}
                  >
                    <td className="px-4 py-3 font-medium text-fg">{r.title}</td>
                    <td className="px-4 py-3 text-fg">{r.guest}</td>
                    <td className="px-4 py-3 text-fg-muted">{r.dates}</td>
                    <td className="px-4 py-3">
                      <Pill tone={r.source === 'Airbnb' ? 'info' : 'neutral'}>{r.source}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={r.status}>{r.statusLabel}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <p className="text-xs text-fg-subtle">
        Numbers shown are illustrative. Live data wires up in M2 (identity &amp; properties) and onward.
      </p>
    </div>
  );
}
