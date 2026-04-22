import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentSession } from '@/modules/auth/current';
import { listTasksForHousekeeper } from '@/modules/housekeeping/service';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ m?: string }>;
}

function parseMonthParam(m: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (!m || !/^\d{4}-\d{2}$/.test(m)) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const [y, mo] = m.split('-').map((x) => Number.parseInt(x, 10));
  return { year: y!, month: mo! };
}
function daysInMonth(year: number, month: number): number { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }
function prevMonth(year: number, month: number): string { const m = month - 1; return m === 0 ? `${year - 1}-12` : `${year}-${String(m).padStart(2, '0')}`; }
function nextMonth(year: number, month: number): string { const m = month + 1; return m === 13 ? `${year + 1}-01` : `${year}-${String(m).padStart(2, '0')}`; }

export default async function CalendarPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hk.calendar');

  const sp = await searchParams;
  const { year, month } = parseMonthParam(sp.m);
  const { user } = await getCurrentSession();
  const meId = user!.id;
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month - 1, daysInMonth(year, month)));
  const tasks = await listTasksForHousekeeper(meId, { from, to });

  const byDay = new Map<number, typeof tasks>();
  for (const task of tasks) {
    const d = task.date.getUTCDate();
    const bucket = byDay.get(d) ?? [];
    bucket.push(task);
    byDay.set(d, bucket);
  }

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const dowMon0 = (firstOfMonth.getUTCDay() + 6) % 7;
  const total = daysInMonth(year, month);
  const cells: Array<{ day: number | null; inMonth: boolean }> = [];
  for (let i = 0; i < dowMon0; i++) cells.push({ day: null, inMonth: false });
  for (let d = 1; d <= total; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: null, inMonth: false });

  const monthLabel = firstOfMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{monthLabel}</h1>
        <div className="flex gap-1">
          <Link href={`/housekeeper/calendar?m=${prevMonth(year, month)}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted hover:bg-surface-2">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link href={`/housekeeper/calendar?m=${nextMonth(year, month)}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted hover:bg-surface-2">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-fg-muted">
        {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map((d) => (<div key={d} className="py-1">{d}</div>))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const list = c.day ? byDay.get(c.day) ?? [] : [];
          return (
            <div key={i} className={cn(
              'flex min-h-[56px] flex-col gap-0.5 rounded-md border border-border bg-surface p-1 text-left text-[11px]',
              !c.inMonth && 'bg-surface-2 opacity-40',
            )}>
              {c.day && <span className="font-semibold text-fg">{c.day}</span>}
              {list.slice(0, 2).map((task) => (
                <Link key={task.id} href={`/housekeeper/tasks/${task.id}`}
                  className="block truncate rounded bg-accent-50 px-1 text-[10px] font-medium text-accent-700">
                  {task.trip.property.name}
                </Link>
              ))}
              {list.length > 2 && (<span className="text-[10px] text-fg-muted">+{list.length - 2} {t('more')}</span>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
