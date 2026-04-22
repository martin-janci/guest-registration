import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/link';
import { requireAdmin } from '@/lib/authz';
import { getInvoiceById } from '@/modules/invoices/service';
import { EditInvoiceForm } from './form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const inv = await getInvoiceById(id);
  if (!inv) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Edit invoice</h1>
          <p className="mt-1 text-sm text-fg-muted font-mono">{inv.invoiceNumber}</p>
        </div>
        <Link href={`/admin/invoices/${inv.id}`} className="text-sm text-accent-600 hover:text-accent-700">Back</Link>
      </header>

      <EditInvoiceForm
        id={inv.id}
        initial={{
          clientName: inv.clientName,
          clientEmail: inv.clientEmail,
          clientVatNumber: inv.clientVatNumber,
          clientAddress: inv.clientAddress,
          issueDate: inv.issueDate.toISOString().slice(0, 10),
          dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
          currency: inv.currency,
          notes: inv.notes,
        }}
      />
    </div>
  );
}
