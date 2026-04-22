import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getUserById } from '@/modules/users/service';
import { EditUserForm } from './form';
import { ResetPasswordPanel } from './reset-password-panel';
import { DeletePanel } from './delete-panel';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const { id: idRaw, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.users');
  await requireAdmin();
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t('form.editHeading')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {user.username} · {user.email}
          </p>
        </div>
        <Link href="/admin/users" className="text-sm text-accent-600 hover:text-accent-700">
          {t('backToUsers')}
        </Link>
      </header>

      <EditUserForm
        id={user.id}
        initial={{ username: user.username, email: user.email, role: user.role }}
      />

      <ResetPasswordPanel id={user.id} />

      <DeletePanel id={user.id} deleted={user.deletedAt !== null} />
    </div>
  );
}
