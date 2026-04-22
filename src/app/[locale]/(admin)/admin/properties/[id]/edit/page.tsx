import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getPropertyById } from '@/modules/properties/service';
import { EditPropertyForm } from './form';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { id: idRaw, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.properties.form');
  const tCommon = await getTranslations('admin.common');
  await requireAdmin();
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const p = await getPropertyById(id);
  if (!p) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('editHeading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{p.name}</p>
        </div>
        <Link href={`/admin/properties/${p.id}`} className="text-sm text-accent-600 hover:text-accent-700">
          {tCommon('back')}
        </Link>
      </header>

      <EditPropertyForm
        id={p.id}
        initial={{ name: p.name, maxGuests: p.maxGuests, notes: p.notes, deleted: p.deletedAt !== null }}
      />
    </div>
  );
}
