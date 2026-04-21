import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { NewCalendarForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewCalendarPage() {
  await requireAdmin();
  const props = await listProperties();

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">New calendar</h1>
          <p className="mt-1 text-sm text-fg-muted">Paste an Airbnb or other iCal URL.</p>
        </div>
        <Link href="/admin/calendars" className="text-sm text-accent-600 hover:text-accent-700">
          Back
        </Link>
      </header>

      <NewCalendarForm properties={props.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
