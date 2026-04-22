import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { listTrips } from '@/modules/trips/service';
import { listUsers } from '@/modules/users/service';
import { NewTaskForm } from './form';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function NewTaskPage() {
  const admin = await requireAdmin();
  const t = await getTranslations('admin.housekeeping');
  const tc = await getTranslations('admin.common');
  const [trips, users] = await Promise.all([
    listTrips(admin.id, { includePast: false }),
    listUsers(),
  ]);
  const tripOptions = trips.map((trip) => ({
    id: trip.id, title: trip.title, propertyName: trip.property.name,
    endDate: trip.endDate.toISOString().slice(0, 10),
  }));
  const hkOptions = users
    .filter((u) => u.role === 'HOUSEKEEPER' && !u.deletedAt)
    .map((u) => ({ id: u.id, username: u.username, email: u.email }));

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('form.newHeading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('form.newSubheading')}</p>
        </div>
        <Link href="/admin/housekeeping" className="text-sm text-accent-600 hover:text-accent-700">{tc('back')}</Link>
      </header>
      <NewTaskForm trips={tripOptions} housekeepers={hkOptions} />
    </div>
  );
}
