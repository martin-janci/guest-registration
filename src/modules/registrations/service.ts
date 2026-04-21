import type { Prisma, Registration, Guest, Trip, Property } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  submitRegistrationSchema,
  registrationFiltersSchema,
  type SubmitRegistrationInput,
  type RegistrationFilters,
} from './schema';

export type RegistrationWithRelations = Registration & {
  guests: Guest[];
  trip: Trip & { property: Pick<Property, 'id' | 'name' | 'ownerId'> };
};

export interface GuestCreateData {
  firstName: string;
  lastName: string;
  ageCategory: 'ADULT' | 'CHILD';
  documentType: 'PASSPORT' | 'DRIVING_LICENSE' | 'CITIZEN_ID';
  documentNumber: string;
  documentImageKey: string | null;
  gdprConsent: boolean;
}

export async function getTripByConfirmCode(
  confirmCode: string,
): Promise<(Trip & { property: Pick<Property, 'id' | 'name'> }) | null> {
  return prisma.trip.findUnique({
    where: { externalConfirmCode: confirmCode },
    include: { property: { select: { id: true, name: true } } },
  });
}

export async function countSubmissionsForTrip(tripId: number): Promise<number> {
  return prisma.registration.count({
    where: { tripId, status: { not: 'REJECTED' } },
  });
}

export async function submitRegistration(
  input: SubmitRegistrationInput,
  guestRecords: GuestCreateData[],
): Promise<RegistrationWithRelations> {
  const parsed = submitRegistrationSchema.parse(input);
  if (guestRecords.length !== parsed.guests.length) {
    throw new Error('Guest records mismatch with validated guests count');
  }
  return prisma.registration.create({
    data: {
      tripId: parsed.tripId,
      email: parsed.email,
      guests: { create: guestRecords },
    },
    include: {
      guests: true,
      trip: { include: { property: { select: { id: true, name: true, ownerId: true } } } },
    },
  });
}

export async function listRegistrations(
  filters: RegistrationFilters = {},
): Promise<RegistrationWithRelations[]> {
  const parsed = registrationFiltersSchema.parse(filters);
  const where: Prisma.RegistrationWhereInput = {};
  if (parsed.status) where.status = parsed.status;
  if (parsed.tripId) where.tripId = parsed.tripId;
  return prisma.registration.findMany({
    where,
    include: {
      guests: true,
      trip: { include: { property: { select: { id: true, name: true, ownerId: true } } } },
    },
    orderBy: [{ submittedAt: 'desc' }],
  });
}

export async function getRegistrationById(id: number): Promise<RegistrationWithRelations | null> {
  return prisma.registration.findUnique({
    where: { id },
    include: {
      guests: true,
      trip: { include: { property: { select: { id: true, name: true, ownerId: true } } } },
    },
  });
}

export async function approveRegistration(
  id: number,
  reviewerId: number,
  adminComment: string | null,
): Promise<RegistrationWithRelations> {
  return prisma.registration.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      adminComment,
    },
    include: {
      guests: true,
      trip: { include: { property: { select: { id: true, name: true, ownerId: true } } } },
    },
  });
}

export async function rejectRegistration(
  id: number,
  reviewerId: number,
  adminComment: string,
): Promise<RegistrationWithRelations> {
  return prisma.registration.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      adminComment,
    },
    include: {
      guests: true,
      trip: { include: { property: { select: { id: true, name: true, ownerId: true } } } },
    },
  });
}
