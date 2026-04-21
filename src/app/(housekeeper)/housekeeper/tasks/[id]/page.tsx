import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { getCurrentSession } from '@/modules/auth/current';
import { getTaskById } from '@/modules/housekeeping/service';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { formatMoney } from '@/lib/money';
import { startTaskAction, completeTaskAction, deletePhotoAction } from './actions';
import { UploadPhotoForm } from './photo-form';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ id: string }> }

function statusTone(s: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') {
  if (s === 'COMPLETED') return 'success' as const;
  if (s === 'IN_PROGRESS') return 'info' as const;
  return 'warning' as const;
}
function fmt(d: Date): string { return d.toISOString().slice(0, 10); }

export default async function HousekeeperTaskPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const [task, session] = await Promise.all([getTaskById(id), getCurrentSession()]);
  if (!task) notFound();
  const user = session.user!;
  if (user.role === 'HOUSEKEEPER' && task.housekeeperId !== user.id) redirect('/housekeeper/dashboard');

  const canStart = task.status === 'PENDING';
  const canComplete = task.status === 'IN_PROGRESS';

  return (
    <div className="flex flex-col gap-5">
      <Link href="/housekeeper/dashboard" className="inline-flex items-center gap-1 text-sm text-accent-600">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        All tasks
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{task.trip.property.name}</h1>
        <p className="text-sm text-fg-muted">{task.trip.title} · {fmt(task.date)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={statusTone(task.status)}>{task.status.toLowerCase().replace('_', ' ')}</Pill>
          {task.paid ? <Pill tone="success">paid</Pill> : <Pill tone="neutral">unpaid</Pill>}
          <span className="ml-auto text-sm tabular-nums font-semibold text-fg">{formatMoney(task.payAmount.toFixed(2), 'EUR')}</span>
        </div>
      </header>

      {task.notes && (
        <section className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium text-fg">Notes from admin</p>
          <p className="mt-1 whitespace-pre-wrap text-fg-muted">{task.notes}</p>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-fg">Photos ({task.photos.length})</h2>
        {task.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {task.photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-md border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/housekeeping/photos/${p.id}`} alt={`Photo ${p.id}`} className="h-full w-full object-cover" />
                <form action={deletePhotoAction.bind(null, task.id, p.id)} className="absolute top-1 right-1">
                  <button type="submit" className="rounded-full bg-surface/90 p-1 text-fg-muted shadow-xs hover:text-danger-700">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
        {task.status !== 'COMPLETED' && <UploadPhotoForm taskId={task.id} />}
      </section>

      <section className="flex flex-col gap-3">
        {canStart && (
          <form action={startTaskAction.bind(null, task.id)}>
            <Button type="submit" size="lg" className="w-full">Start cleaning</Button>
          </form>
        )}
        {canComplete && (
          <form action={completeTaskAction.bind(null, task.id)}>
            <Button type="submit" size="lg" className="w-full">Mark complete</Button>
          </form>
        )}
        {task.status === 'COMPLETED' && (
          <p className="rounded-md border border-success-100 bg-success-100 px-3 py-2 text-sm text-success-700">
            Completed {task.completedAt ? task.completedAt.toISOString().slice(0, 16).replace('T', ' ') : ''}.
            {task.paid ? ' Payment received.' : ' Awaiting payment.'}
          </p>
        )}
      </section>
    </div>
  );
}
