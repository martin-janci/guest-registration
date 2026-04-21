import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { NewInvoiceForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">New invoice</h1>
          <p className="mt-1 text-sm text-fg-muted">Start with the client + header; add line items on the detail page.</p>
        </div>
        <Link href="/admin/invoices" className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>
      <NewInvoiceForm />
    </div>
  );
}
