import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getTaskById } from '@/modules/housekeeping/service';
import { listUsers } from '@/modules/users/service';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ id: string }> }

function statusTone(s: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') {
  if (s === 'COMPLETED') return 'success' as const;
  if (s === 'IN_PROGRESS') return 'info' as const;
  return 'warning' as const;
}
function fmt(d: Date): string { return d.toISOString().slice(0, 10); }

export default async function HousekeepingDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const task = await getTaskById(id);
  if (!task) notFound();
  const allUsers = await listUsers();
  const housekeepers = allUsers.filter((u) => u.role === 'HOUSEKEEPER' && !u.deletedAt);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Housekeeping task #{task.id}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{task.trip.property.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {fmt(task.date)} · assigned to <strong>{task.housekeeper.username}</strong> · {formatMoney(task.payAmount.toFixed(2), 'EUR')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Pill tone={statusTone(task.status)}>{task.status.toLowerCase().replace('_', ' ')}</Pill>
          {task.paid ? <Pill tone="success">paid</Pill> : <Pill tone="neutral">unpaid</Pill>}
        </div>
      </header>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-fg-muted">Trip</dt>
          <dd className="text-fg"><Link href={`/admin/trips/${task.trip.id}`} className="hover:text-accent-700">{task.trip.title}</Link></dd>
          <dt className="text-fg-muted">Cleaning date</dt>
          <dd className="text-fg">{fmt(task.date)}</dd>
          <dt className="text-fg-muted">Started</dt>
          <dd className="text-fg">{task.startedAt ? task.startedAt.toISOString().slice(0, 16).replace('T', ' ') : '—'}</dd>
          <dt className="text-fg-muted">Completed</dt>
          <dd className="text-fg">{task.completedAt ? task.completedAt.toISOString().slice(0, 16).replace('T', ' ') : '—'}</dd>
          <dt className="text-fg-muted">Notes</dt>
          <dd className="text-fg whitespace-pre-wrap">{task.notes ?? '—'}</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Photos ({task.photos.length})</h2>
        {task.photos.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">No photos uploaded yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {task.photos.map((p) => (
              <a key={p.id} href={`/api/housekeeping/photos/${p.id}`} target="_blank" rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-md border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/housekeeping/photos/${p.id}`} alt={`Photo ${p.id}`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Reassign</h2>
        <form action={`/admin/housekeeping/${task.id}/reassign`} method="post" className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-fg">Housekeeper</label>
            <Select name="housekeeperId" defaultValue={task.housekeeperId} required>
              {housekeepers.map((h) => (<option key={h.id} value={h.id}>{h.username}</option>))}
            </Select>
          </div>
          <div className="flex w-32 flex-col gap-1">
            <label className="text-xs font-medium text-fg">New pay (€)</label>
            <Input name="payAmount" inputMode="decimal" placeholder={task.payAmount.toFixed(2)} />
          </div>
          <Button type="submit" variant="secondary">Reassign</Button>
        </form>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <form action={`/admin/housekeeping/${task.id}/toggle-paid`} method="post">
          <Button type="submit">{task.paid ? 'Mark unpaid' : 'Mark paid'}</Button>
        </form>
        <form action={`/admin/housekeeping/${task.id}/delete`} method="post">
          <Button type="submit" variant="danger">Delete</Button>
        </form>
      </section>
    </div>
  );
}
