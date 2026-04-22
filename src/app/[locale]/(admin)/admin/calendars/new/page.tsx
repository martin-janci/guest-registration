import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { NewCalendarForm } from './form';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.calendars.form');
  const tCommon = await getTranslations('admin.common');
  await requireAdmin();
  const props = await listProperties();

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('newHeading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('newSubheading')}</p>
        </div>
        <Link href="/admin/calendars" className="text-sm text-accent-600 hover:text-accent-700">
          {tCommon('back')}
        </Link>
      </header>

      <NewCalendarForm properties={props.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
