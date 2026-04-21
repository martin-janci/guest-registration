import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { getInvoiceById } from '@/modules/invoices/service';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { ItemAddForm, ItemRow } from './item-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function statusTone(s: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE') {
  if (s === 'PAID') return 'success' as const;
  if (s === 'SENT') return 'info' as const;
  if (s === 'OVERDUE') return 'danger' as const;
  return 'neutral' as const;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();
  const inv = await getInvoiceById(id);
  if (!inv) notFound();

  const isDraft = inv.status === 'DRAFT';
  const isSent = inv.status === 'SENT';
  const canMarkPaid = inv.status === 'SENT' || inv.status === 'OVERDUE';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Invoice</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg font-mono">{inv.invoiceNumber}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {inv.clientName} · issued {fmtDate(inv.issueDate)}
            {inv.dueDate && <> · due {fmtDate(inv.dueDate)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={statusTone(inv.status)}>{inv.status.toLowerCase()}</Pill>
          <Link href={`/admin/invoices/${inv.id}/edit`}><Button variant="secondary">Edit</Button></Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-fg">Client</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-fg-muted">Name</dt>
          <dd className="text-fg">{inv.clientName}</dd>
          <dt className="text-fg-muted">Email</dt>
          <dd className="text-fg">{inv.clientEmail ?? '—'}</dd>
          <dt className="text-fg-muted">VAT #</dt>
          <dd className="text-fg">{inv.clientVatNumber ?? '—'}</dd>
          <dt className="text-fg-muted">Address</dt>
          <dd className="text-fg whitespace-pre-wrap">{inv.clientAddress ?? '—'}</dd>
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Line items</h2>
          <span className="text-xs text-fg-muted">{inv.items.length} items</span>
        </div>
        {inv.items.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-fg-muted">No items yet.</p>
        )}
        {inv.items.map((it) => (
          <ItemRow
            key={it.id}
            invoiceId={inv.id}
            itemId={it.id}
            description={it.description}
            quantity={it.quantity.toFixed(2)}
            unitPrice={it.unitPrice.toFixed(2)}
            vatRate={it.vatRate.toFixed(2)}
            lineDisplay={formatMoney(it.lineTotal.toFixed(2), inv.currency)}
            totalDisplay={formatMoney(it.totalWithVat.toFixed(2), inv.currency)}
          />
        ))}
        {isDraft && <ItemAddForm invoiceId={inv.id} mode="add" />}
      </section>

      <section className="flex justify-end rounded-lg border border-border bg-surface p-4 shadow-xs">
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex items-baseline gap-6">
            <dt className="w-32 text-right text-fg-muted">Subtotal</dt>
            <dd className="w-32 text-right tabular-nums text-fg">{formatMoney(inv.subtotal.toFixed(2), inv.currency)}</dd>
          </div>
          <div className="flex items-baseline gap-6">
            <dt className="w-32 text-right text-fg-muted">VAT</dt>
            <dd className="w-32 text-right tabular-nums text-fg">{formatMoney(inv.vatTotal.toFixed(2), inv.currency)}</dd>
          </div>
          <div className="flex items-baseline gap-6 border-t border-border pt-1">
            <dt className="w-32 text-right font-semibold text-fg">Total</dt>
            <dd className="w-32 text-right tabular-nums font-semibold text-fg">{formatMoney(inv.totalAmount.toFixed(2), inv.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <a href={`/admin/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">Download PDF</Button>
          </a>
          {isDraft && (
            <form action={`/admin/invoices/${inv.id}/send`} method="post">
              <Button type="submit">Send by email</Button>
            </form>
          )}
          {canMarkPaid && (
            <form action={`/admin/invoices/${inv.id}/mark-paid`} method="post">
              <Button type="submit" variant="secondary">Mark paid</Button>
            </form>
          )}
        </div>
        {inv.items.length === 0 && (isDraft || isSent) && (
          <p className="text-xs text-warning-700">Add at least one line item before sending.</p>
        )}
      </section>

      {inv.notes && (
        <section className="rounded-lg border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-fg">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-fg">{inv.notes}</p>
        </section>
      )}
    </div>
  );
}
