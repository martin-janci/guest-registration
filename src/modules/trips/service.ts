import type { Prisma, Trip, TripSource, Property, User } from '@prisma/client';
import { prisma } from '@/db/client';
import { generateConfirmCode } from '@/lib/confirm-code';
import {
  createTripSchema,
  updateTripSchema,
  type CreateTripInput,
  type TripFilters,
  type UpdateTripInput,
} from './schema';

export type TripWithRelations = Trip & {
  property: Pick<Property, 'id' | 'name'>;
  admin: Pick<User, 'id' | 'username'>;
};

export async function listTrips(
  adminId: number,
  filters: TripFilters = { includePast: false },
): Promise<TripWithRelations[]> {
  const where: Prisma.TripWhereInput = { adminId };
  if (filters.propertyId) where.propertyId = filters.propertyId;
  if (filters.source) where.source = filters.source;
  if (filters.from || filters.to) {
    where.startDate = {};
    if (filters.from) where.startDate.gte = filters.from;
    if (filters.to) where.startDate.lte = filters.to;
  }
  if (!filters.includePast) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    where.endDate = { gte: today };
  }
  return prisma.trip.findMany({
    where,
    include: {
      property: { select: { id: true, name: true } },
      admin: { select: { id: true, username: true } },
    },
    orderBy: [{ startDate: 'asc' }],
  });
}

export async function getTripById(id: number): Promise<TripWithRelations | null> {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true } },
      admin: { select: { id: true, username: true } },
    },
  });
}

export async function createTrip(adminId: number, input: CreateTripInput): Promise<Trip> {
  const data = createTripSchema.parse(input);
  return prisma.trip.create({
    data: {
      adminId,
      title: data.title,
      propertyId: data.propertyId,
      startDate: data.startDate,
      endDate: data.endDate,
      maxGuests: data.maxGuests,
      notes: data.notes ?? null,
      source: 'MANUAL',
      externalConfirmCode: generateConfirmCode(),
    },
  });
}

export async function updateTrip(id: number, input: UpdateTripInput): Promise<Trip> {
  const data = updateTripSchema.parse(input);
  return prisma.trip.update({
    where: { id },
    data: {
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      maxGuests: data.maxGuests,
      notes: data.notes ?? null,
    },
  });
}

export async function deleteTrip(id: number): Promise<void> {
  await prisma.trip.delete({ where: { id } });
}

export interface UpsertExternalTripInput {
  adminId: number;
  propertyId: number;
  calendarId: number;
  source: TripSource;
  externalReservationId: string;
  externalConfirmCode: string | null;
  externalGuestName: string | null;
  externalGuestCount: number | null;
  startDate: Date;
  endDate: Date;
  title: string;
  maxGuests: number;
}

export async function upsertExternalTrip(
  input: UpsertExternalTripInput,
): Promise<{ trip: Trip; created: boolean }> {
  const existing = await prisma.trip.findUnique({
    where: { externalReservationId: input.externalReservationId },
  });
  if (existing) {
    const trip = await prisma.trip.update({
      where: { id: existing.id },
      data: {
        startDate: input.startDate,
        endDate: input.endDate,
        externalGuestName: input.externalGuestName,
        externalGuestCount: input.externalGuestCount,
        externalSyncedAt: new Date(),
        title: input.title,
      },
    });
    return { trip, created: false };
  }
  const trip = await prisma.trip.create({
    data: {
      adminId: input.adminId,
      propertyId: input.propertyId,
      calendarId: input.calendarId,
      source: input.source,
      externalReservationId: input.externalReservationId,
      externalConfirmCode: input.externalConfirmCode,
      externalGuestName: input.externalGuestName,
      externalGuestCount: input.externalGuestCount,
      externalSyncedAt: new Date(),
      startDate: input.startDate,
      endDate: input.endDate,
      title: input.title,
      maxGuests: input.maxGuests,
    },
  });
  return { trip, created: true };
}

export async function getUpcomingForAdmin(adminId: number): Promise<TripWithRelations[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const in7 = new Date(today);
  in7.setUTCDate(in7.getUTCDate() + 7);
  return prisma.trip.findMany({
    where: { adminId, startDate: { gte: today, lte: in7 } },
    include: {
      property: { select: { id: true, name: true } },
      admin: { select: { id: true, username: true } },
    },
    orderBy: [{ startDate: 'asc' }],
  });
}
