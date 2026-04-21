import { getCurrentSession } from '@/modules/auth/current';
import { listTasksForHousekeeper } from '@/modules/housekeeping/service';
import { TaskCard } from '@/components/housekeeper/task-card';

export const dynamic = 'force-dynamic';

function fmt(d: Date): string { return d.toISOString().slice(0, 10); }
function today(): Date { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; }
function inDays(n: number): Date { const d = today(); d.setUTCDate(d.getUTCDate() + n); return d; }

export default async function DashboardPage() {
  const { user } = await getCurrentSession();
  const meId = user!.id;
  const [todayTasks, upcoming] = await Promise.all([
    listTasksForHousekeeper(meId, { from: today(), to: today() }),
    listTasksForHousekeeper(meId, { from: inDays(1), to: inDays(7) }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Today</h1>
        <p className="mt-1 text-sm text-fg-muted">{fmt(today())}</p>
      </header>

      {todayTasks.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-fg-muted">
          No cleanings scheduled today.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {todayTasks.map((t) => (
            <TaskCard key={t.id} task={{
              id: t.id, propertyName: t.trip.property.name, tripTitle: t.trip.title,
              date: fmt(t.date), status: t.status, paid: t.paid,
              payAmount: t.payAmount.toFixed(2), photoCount: t.photos.length,
            }} />
          ))}
        </div>
      )}

      <h2 className="mt-4 text-sm font-semibold text-fg">Next 7 days</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-fg-muted">Nothing scheduled.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((t) => (
            <TaskCard key={t.id} task={{
              id: t.id, propertyName: t.trip.property.name, tripTitle: t.trip.title,
              date: fmt(t.date), status: t.status, paid: t.paid,
              payAmount: t.payAmount.toFixed(2), photoCount: t.photos.length,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
