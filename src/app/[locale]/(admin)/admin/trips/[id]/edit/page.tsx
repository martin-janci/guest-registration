import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getTripById } from '@/modules/trips/service';
import { EditTripForm } from './form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTripPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const trip = await getTripById(id);
  if (!trip) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit trip</h1>
          <p className="mt-1 text-sm text-fg-muted">{trip.title}</p>
        </div>
        <Link href={`/admin/trips/${trip.id}`} className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <EditTripForm
        id={trip.id}
        initial={{
          title: trip.title,
          startDate: trip.startDate.toISOString().slice(0, 10),
          endDate: trip.endDate.toISOString().slice(0, 10),
          maxGuests: trip.maxGuests,
          notes: trip.notes,
        }}
      />
    </div>
  );
}
