import Link from 'next/link';
import { Plus, UserMinus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listUsers } from '@/modules/users/service';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ deleted?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const includeDeleted = params.deleted === '1';
  const users = await listUsers({ includeDeleted });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Users</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Admins, superadmins, and housekeepers with account access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={includeDeleted ? '/admin/users' : '/admin/users?deleted=1'}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            {includeDeleted ? 'Hide deleted' : 'Show deleted'}
          </Link>
          <Link href="/admin/users/new">
            <Button size="md">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New user
            </Button>
          </Link>
        </div>
      </header>

      <DataTable
        rowKey={(u) => u.id}
        rows={users}
        columns={[
          { key: 'username', header: 'Username', render: (u) => (
            <span className="font-medium text-fg">{u.username}</span>
          ) },
          { key: 'email', header: 'Email', render: (u) => <span className="text-fg-muted">{u.email}</span> },
          { key: 'role', header: 'Role', render: (u) => (
            <Pill tone={u.role === 'SUPERADMIN' ? 'accent' : u.role === 'ADMIN' ? 'info' : 'neutral'}>
              {u.role.toLowerCase()}
            </Pill>
          ) },
          { key: 'status', header: 'Status', render: (u) => (
            u.deletedAt
              ? <Pill tone="danger">Deleted</Pill>
              : <Pill tone="success">Active</Pill>
          ) },
          { key: 'actions', header: '', align: 'right', render: (u) => (
            <Link
              href={`/admin/users/${u.id}/edit`}
              className="text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              Edit
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <UserMinus className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No users yet. <Link href="/admin/users/new" className="text-accent-600">Add one</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
