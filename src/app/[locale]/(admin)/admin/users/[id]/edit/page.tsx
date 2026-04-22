import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getUserById } from '@/modules/users/service';
import { EditUserForm } from './form';
import { ResetPasswordPanel } from './reset-password-panel';
import { DeletePanel } from './delete-panel';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit user</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {user.username} · {user.email}
          </p>
        </div>
        <Link href="/admin/users" className="text-sm text-accent-600 hover:text-accent-700">
          Back to users
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
