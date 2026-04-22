'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { addItem, updateItem, deleteItem } from '@/modules/invoices/service';
import { itemSchema } from '@/modules/invoices/schema';

export type ItemState = { error?: string; fieldErrors?: Record<string, string> };

export async function addItemAction(
  invoiceId: number,
  _prev: ItemState | undefined,
  formData: FormData,
): Promise<ItemState> {
  await requireAdmin();
  const parsed = itemSchema.safeParse({
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    unitPrice: formData.get('unitPrice'),
    vatRate: formData.get('vatRate'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid item' };
  }
  await addItem(invoiceId, parsed.data);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  return {};
}

export async function updateItemAction(
  invoiceId: number,
  itemId: number,
  _prev: ItemState | undefined,
  formData: FormData,
): Promise<ItemState> {
  await requireAdmin();
  const parsed = itemSchema.safeParse({
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    unitPrice: formData.get('unitPrice'),
    vatRate: formData.get('vatRate'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid item' };
  }
  await updateItem(itemId, parsed.data);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  return {};
}

export async function deleteItemAction(
  invoiceId: number,
  itemId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();
  await deleteItem(itemId);
  revalidatePath(`/admin/invoices/${invoiceId}`);
}
