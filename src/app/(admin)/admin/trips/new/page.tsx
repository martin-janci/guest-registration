import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { NewTripForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewTripPage() {
  await requireAdmin();
  const props = await listProperties();

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">New trip</h1>
          <p className="mt-1 text-sm text-fg-muted">A manual reservation (not imported from Airbnb).</p>
        </div>
        <Link href="/admin/trips" className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <NewTripForm properties={props.map((p) => ({ id: p.id, name: p.name, maxGuests: p.maxGuests }))} />
    </div>
  );
}
