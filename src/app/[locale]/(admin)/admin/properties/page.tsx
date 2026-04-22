import { Link } from '@/lib/i18n/link';
import { Home, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authz';
import { listProperties } from '@/modules/properties/service';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ deleted?: string }>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const includeDeleted = params.deleted === '1';
  const rows = await listProperties({ includeDeleted });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Properties</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Apartments and cottages you rent through Airbnb.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={includeDeleted ? '/admin/properties' : '/admin/properties?deleted=1'}
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            {includeDeleted ? 'Hide deleted' : 'Show deleted'}
          </Link>
          <Link href="/admin/properties/new">
            <Button><Plus className="h-4 w-4" strokeWidth={1.75} />New property</Button>
          </Link>
        </div>
      </header>

      <DataTable
        rowKey={(p) => p.id}
        rows={rows}
        columns={[
          { key: 'name', header: 'Name', render: (p) => (
            <Link href={`/admin/properties/${p.id}`} className="font-medium text-fg hover:text-accent-700">
              {p.name}
            </Link>
          ) },
          { key: 'owner', header: 'Owner', render: (p) => (
            <span className="text-fg-muted">{p.owner.username}</span>
          ) },
          { key: 'maxGuests', header: 'Max guests', align: 'right', render: (p) => (
            <span className="tabular-nums text-fg">{p.maxGuests ?? '—'}</span>
          ) },
          { key: 'status', header: 'Status', render: (p) => (
            p.deletedAt ? <Pill tone="danger">Deleted</Pill> : <Pill tone="success">Active</Pill>
          ) },
          { key: 'actions', header: '', align: 'right', render: (p) => (
            <Link href={`/admin/properties/${p.id}/edit`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Edit
            </Link>
          ) },
        ]}
        emptyState={
          <>
            <Home className="h-10 w-10 text-fg-subtle" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">
              No properties yet. <Link href="/admin/properties/new" className="text-accent-600">Add one</Link>.
            </p>
          </>
        }
      />
    </div>
  );
}
