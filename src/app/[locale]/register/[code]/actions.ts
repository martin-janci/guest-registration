'use server';

import { redirect } from '@/lib/i18n/link';
import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';
import { env } from '@/lib/env';
import { prisma } from '@/db/client';
import {
  submitRegistrationSchema,
  type SubmitGuestInput,
} from '@/modules/registrations/schema';
import {
  submitRegistration,
  countSubmissionsForTrip,
  type GuestCreateData,
} from '@/modules/registrations/service';
import { uploadFile } from '@/modules/storage/service';
import { uploadFileValidation } from '@/modules/storage/schema';
import { sendMail } from '@/modules/email/service';
import { adminRegistrationTemplate } from '@/modules/email/templates/admin-registration';
import { guestConfirmationTemplate } from '@/modules/email/templates/guest-confirmation';

export type SubmitState = { error?: string; fieldErrors?: Record<string, string> };

interface RawGuest extends Partial<SubmitGuestInput> {
  document?: File;
}

function parseGuestsFromFormData(formData: FormData): RawGuest[] {
  const byIdx = new Map<number, RawGuest>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^guests\.(\d+)\.([a-zA-Z]+)$/);
    if (!m) continue;
    const idx = Number(m[1]);
    const field = m[2]!;
    const bucket = byIdx.get(idx) ?? {};
    if (field === 'document' && value instanceof File) {
      if (value.size > 0) bucket.document = value;
    } else if (field === 'gdprConsent') {
      bucket.gdprConsent = value === 'on' || value === 'true';
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (bucket as any)[field] = value;
    }
    byIdx.set(idx, bucket);
  }
  return Array.from(byIdx.entries())
    .sort(([a], [b]) => a - b)
    .map(([, v]) => v);
}

export async function submitAction(
  _prev: SubmitState | undefined,
  formData: FormData,
): Promise<SubmitState> {
  const tripIdRaw = formData.get('tripId');
  const email = formData.get('email');
  const rawGuests = parseGuestsFromFormData(formData);

  const parsed = submitRegistrationSchema.safeParse({
    tripId: tripIdRaw,
    email,
    guests: rawGuests.map((g) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      ageCategory: g.ageCategory,
      documentType: g.documentType,
      documentNumber: g.documentNumber,
      gdprConsent: g.gdprConsent,
    })),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const trip = await prisma.trip.findUnique({
    where: { id: parsed.data.tripId },
    include: {
      property: { select: { id: true, name: true, ownerId: true } },
      admin: { select: { id: true, email: true, username: true } },
    },
  });
  if (!trip) {
    return { error: 'Invalid trip' };
  }

  if ((await countSubmissionsForTrip(trip.id)) > 0) {
    return { error: 'This booking is already registered. Contact your host.' };
  }

  for (let i = 0; i < rawGuests.length; i++) {
    const doc = rawGuests[i]!.document;
    if (!doc) continue;
    const fv = uploadFileValidation.safeParse(doc);
    if (!fv.success) {
      return { error: `Guest ${i + 1}: ${fv.error.issues[0]?.message ?? 'Invalid file'}` };
    }
  }

  const confirmCode = trip.externalConfirmCode ?? 'noop';

  const guestRecords: GuestCreateData[] = [];
  for (let i = 0; i < rawGuests.length; i++) {
    const raw = rawGuests[i]!;
    let documentImageKey: string | null = null;
    if (raw.document) {
      const ext = (raw.document.name.split('.').pop() ?? 'bin').toLowerCase().slice(0, 5);
      const slug = crypto.randomBytes(6).toString('hex');
      const key = `registrations/${confirmCode}/${Date.now()}-${i}-${slug}.${ext}`;
      await uploadFile(key, raw.document);
      documentImageKey = key;
    }
    const v = parsed.data.guests[i]!;
    guestRecords.push({
      firstName: v.firstName,
      lastName: v.lastName,
      ageCategory: v.ageCategory,
      documentType: v.documentType,
      documentNumber: v.documentNumber,
      documentImageKey,
      gdprConsent: v.gdprConsent,
    });
  }

  const registration = await submitRegistration(parsed.data, guestRecords);

  const reviewUrl = `${env.SERVER_URL.replace(/\/+$/, '')}/admin/registrations/${registration.id}`;
  const submittedAt = registration.submittedAt;
  try {
    await sendMail({
      to: trip.admin.email,
      template: adminRegistrationTemplate({
        adminName: trip.admin.username,
        tripTitle: trip.title,
        propertyName: trip.property.name,
        guestCount: registration.guests.length,
        reviewUrl,
        submittedAt,
      }),
      replyTo: registration.email,
    });
  } catch (err) {
    console.error('Admin notification email failed:', err);
  }

  const firstGuestFirstName = registration.guests[0]?.firstName ?? 'there';
  try {
    await sendMail({
      to: registration.email,
      template: guestConfirmationTemplate({
        guestFirstName: firstGuestFirstName,
        tripTitle: trip.title,
        propertyName: trip.property.name,
      }),
    });
  } catch (err) {
    console.error('Guest confirmation email failed:', err);
  }

  revalidatePath('/admin/registrations');
  return await redirect(`/register/${confirmCode}/success`);
}
