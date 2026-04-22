import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getPropertyById } from '@/modules/properties/service';
import { listAssignments } from '@/modules/property-housekeepers/service';
import { listUsers } from '@/modules/users/service';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { HousekeepersPanel } from './housekeepers-panel';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();

  const p = await getPropertyById(id);
  if (!p) notFound();

  const [assignments, allUsers] = await Promise.all([
    listAssignments(p.id),
    listUsers(),
  ]);
  const assignedIds = new Set(assignments.map((a) => a.housekeeperId));
  const candidates = allUsers
    .filter((u) => u.role === 'HOUSEKEEPER' && !u.deletedAt && !assignedIds.has(u.id))
    .map((u) => ({ id: u.id, username: u.username, email: u.email }));

  const owner = allUsers.find((u) => u.id === p.ownerId);
  const defaultPay = owner?.defaultHousekeeperPay.toString() ?? '20';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{p.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Owner: {p.owner.username} {p.deletedAt && <Pill tone="danger">Deleted</Pill>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/properties/${p.id}/edit`}><Button variant="secondary">Edit</Button></Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-fg-muted">Max guests</dt>
          <dd className="text-fg">{p.maxGuests ?? '—'}</dd>
          <dt className="text-fg-muted">Notes</dt>
          <dd className="text-fg whitespace-pre-wrap">{p.notes ?? '—'}</dd>
        </dl>
      </section>

      <HousekeepersPanel
        propertyId={p.id}
        assignments={assignments.map((a) => ({
          housekeeperId: a.housekeeperId,
          username: a.housekeeper.username,
          email: a.housekeeper.email,
          isDefault: a.isDefault,
          payOverride: a.payOverride?.toString() ?? null,
        }))}
        candidates={candidates}
        propertyDefaultPay={defaultPay}
      />
    </div>
  );
}
