import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { listTrips } from '@/modules/trips/service';
import { listUsers } from '@/modules/users/service';
import { NewTaskForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewTaskPage() {
  const admin = await requireAdmin();
  const [trips, users] = await Promise.all([
    listTrips(admin.id, { includePast: false }),
    listUsers(),
  ]);
  const tripOptions = trips.map((t) => ({
    id: t.id, title: t.title, propertyName: t.property.name,
    endDate: t.endDate.toISOString().slice(0, 10),
  }));
  const hkOptions = users
    .filter((u) => u.role === 'HOUSEKEEPER' && !u.deletedAt)
    .map((u) => ({ id: u.id, username: u.username, email: u.email }));

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">New task</h1>
          <p className="mt-1 text-sm text-fg-muted">Manual cleaning task (not auto-created from an Airbnb sync).</p>
        </div>
        <Link href="/admin/housekeeping" className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>
      <NewTaskForm trips={tripOptions} housekeepers={hkOptions} />
    </div>
  );
}
