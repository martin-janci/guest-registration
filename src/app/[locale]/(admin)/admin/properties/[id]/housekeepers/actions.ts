'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import * as svc from '@/modules/property-housekeepers/service';

export async function assignAction(propertyId: number, formData: FormData): Promise<void> {
  await requireAdmin();
  await svc.assign({
    propertyId,
    housekeeperId: Number(formData.get('housekeeperId')),
    payOverride: String(formData.get('payOverride') ?? ''),
  });
  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function unassignAction(
  propertyId: number,
  housekeeperId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();
  await svc.unassign(propertyId, housekeeperId);
  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function setDefaultAction(
  propertyId: number,
  housekeeperId: number,
  _formData: FormData,
): Promise<void> {
  await requireAdmin();
  await svc.setDefault(propertyId, housekeeperId);
  revalidatePath(`/admin/properties/${propertyId}`);
}
