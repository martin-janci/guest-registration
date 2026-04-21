import type { Calendar, Property } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  createCalendarSchema,
  updateCalendarSchema,
  type CreateCalendarInput,
  type UpdateCalendarInput,
} from './schema';

export type CalendarWithProperty = Calendar & {
  property: Pick<Property, 'id' | 'name' | 'ownerId'>;
};

export async function listCalendars(): Promise<CalendarWithProperty[]> {
  return prisma.calendar.findMany({
    where: { property: { deletedAt: null } },
    include: { property: { select: { id: true, name: true, ownerId: true } } },
    orderBy: [{ property: { name: 'asc' } }, { name: 'asc' }],
  });
}

export async function getCalendarById(id: number): Promise<CalendarWithProperty | null> {
  return prisma.calendar.findUnique({
    where: { id },
    include: { property: { select: { id: true, name: true, ownerId: true } } },
  });
}

export async function createCalendar(input: CreateCalendarInput): Promise<Calendar> {
  const data = createCalendarSchema.parse(input);
  return prisma.calendar.create({ data });
}

export async function updateCalendar(id: number, input: UpdateCalendarInput): Promise<Calendar> {
  const data = updateCalendarSchema.parse(input);
  return prisma.calendar.update({ where: { id }, data });
}

export async function deleteCalendar(id: number): Promise<void> {
  await prisma.calendar.delete({ where: { id } });
}

export async function touchLastSynced(
  id: number,
  patch: { lastSyncedAt: Date; lastSyncError: string | null },
): Promise<void> {
  await prisma.calendar.update({
    where: { id },
    data: { lastSyncedAt: patch.lastSyncedAt, lastSyncError: patch.lastSyncError },
  });
}
