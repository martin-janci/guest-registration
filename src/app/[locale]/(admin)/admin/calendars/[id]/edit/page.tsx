import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getCalendarById } from '@/modules/calendars/service';
import { EditCalendarForm } from './form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCalendarPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const cal = await getCalendarById(id);
  if (!cal) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit calendar</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {cal.property.name} · {cal.name}
          </p>
        </div>
        <Link href="/admin/calendars" className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <EditCalendarForm
        id={cal.id}
        initial={{ name: cal.name, icsUrl: cal.icsUrl, syncIntervalMin: cal.syncIntervalMin }}
      />
    </div>
  );
}
