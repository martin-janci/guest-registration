'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addItemAction, updateItemAction, type ItemState } from './items/actions';

interface AddProps {
  invoiceId: number;
  mode: 'add';
}
interface EditProps {
  invoiceId: number;
  itemId: number;
  initial: { description: string; quantity: string; unitPrice: string; vatRate: string };
  onDone: () => void;
}

export function ItemAddForm({ invoiceId }: AddProps) {
  const [state, action, pending] = useActionState<ItemState | undefined, FormData>(
    addItemAction.bind(null, invoiceId),
    undefined,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t border-border px-4 py-3">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-fg">Description</label>
        <Input name="description" required />
      </div>
      <div className="flex w-20 flex-col gap-1">
        <label className="text-xs font-medium text-fg">Qty</label>
        <Input name="quantity" defaultValue="1" required />
      </div>
      <div className="flex w-24 flex-col gap-1">
        <label className="text-xs font-medium text-fg">Unit €</label>
        <Input name="unitPrice" required />
      </div>
      <div className="flex w-20 flex-col gap-1">
        <label className="text-xs font-medium text-fg">VAT %</label>
        <Input name="vatRate" defaultValue="0" required />
      </div>
      <Button type="submit" size="md" disabled={pending}>Add</Button>
      {state?.error && <p className="w-full text-xs text-danger-700">{state.error}</p>}
    </form>
  );
}

export function ItemEditForm({ invoiceId, itemId, initial, onDone }: EditProps) {
  const [state, action, pending] = useActionState<ItemState | undefined, FormData>(
    async (prev, formData) => {
      const r = await updateItemAction(invoiceId, itemId, prev, formData);
      if (!r.error) onDone();
      return r;
    },
    undefined,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 bg-accent-50 px-4 py-3">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <Input name="description" defaultValue={initial.description} required />
      </div>
      <Input name="quantity" defaultValue={initial.quantity} className="w-20" required />
      <Input name="unitPrice" defaultValue={initial.unitPrice} className="w-24" required />
      <Input name="vatRate" defaultValue={initial.vatRate} className="w-20" required />
      <Button type="submit" size="sm" disabled={pending}>Save</Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
      {state?.error && <p className="w-full text-xs text-danger-700">{state.error}</p>}
    </form>
  );
}

export function ItemRow({
  invoiceId,
  itemId,
  description,
  quantity,
  unitPrice,
  vatRate,
  totalDisplay,
  lineDisplay,
}: {
  invoiceId: number;
  itemId: number;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  totalDisplay: string;
  lineDisplay: string;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <ItemEditForm
        invoiceId={invoiceId}
        itemId={itemId}
        initial={{ description, quantity, unitPrice, vatRate }}
        onDone={() => setEditing(false)}
      />
    );
  }
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-fg">{description}</div>
        <div className="text-xs text-fg-muted">
          {quantity} × {unitPrice} · VAT {vatRate}% · line {lineDisplay}
        </div>
      </div>
      <div className="w-24 text-right tabular-nums font-medium text-fg">{totalDisplay}</div>
      <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-accent-600 hover:text-accent-700">
        Edit
      </button>
      <form
        action={`/admin/invoices/${invoiceId}/items/${itemId}/delete`}
        method="post"
      >
        <button type="submit" className="text-xs font-medium text-danger-700 hover:underline">Delete</button>
      </form>
    </div>
  );
}
