'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { updateMyProfile, changeMyPassword } from '@/modules/settings/service';
import { profileSchema, passwordChangeSchema } from '@/modules/settings/schema';

export type ProfileState = { saved?: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function saveProfileAction(
  _prev: ProfileState | undefined,
  formData: FormData,
): Promise<ProfileState> {
  const admin = await requireAdmin();

  const payload: Record<string, unknown> = {};
  const fields = [
    'companyName', 'companyIco', 'companyVat',
    'contactName', 'contactPhone', 'contactAddress', 'contactWebsite', 'contactDescription',
    'customLine1', 'customLine2', 'customLine3',
    'dateFormat', 'defaultHousekeeperPay',
  ];
  for (const f of fields) payload[f] = formData.get(f) ?? '';
  payload.photoRequiredAdults = formData.get('photoRequiredAdults') === 'on';
  payload.photoRequiredChildren = formData.get('photoRequiredChildren') === 'on';

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') fieldErrors[path] = issue.message;
    }
    return { fieldErrors };
  }

  await updateMyProfile(admin.id, parsed.data);
  revalidatePath('/admin/settings');
  return { saved: true };
}

export type PasswordState = { saved?: boolean; error?: string };

export async function changePasswordAction(
  _prev: PasswordState | undefined,
  formData: FormData,
): Promise<PasswordState> {
  const admin = await requireAdmin();

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const res = await changeMyPassword(admin.id, parsed.data);
  if (!res.ok) {
    return { error: 'Current password is incorrect.' };
  }
  return { saved: true };
}
