import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { NewInvoiceForm } from './form';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  await requireAdmin();
  const t = await getTranslations('admin.invoices');
  const tc = await getTranslations('admin.common');
  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('form.newHeading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('form.newSubheading')}</p>
        </div>
        <Link href="/admin/invoices" className="text-sm text-accent-600 hover:text-accent-700">{tc('back')}</Link>
      </header>
      <NewInvoiceForm />
    </div>
  );
}
