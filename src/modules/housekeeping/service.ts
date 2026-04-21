import type { Prisma, HousekeepingTask, HousekeepingPhoto, User, Trip, Property } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  createTaskSchema,
  reassignSchema,
  taskFiltersSchema,
  type CreateTaskInput,
  type ReassignInput,
  type TaskFilters,
} from './schema';

export type TaskWithRelations = HousekeepingTask & {
  trip: Trip & { property: Pick<Property, 'id' | 'name'> };
  housekeeper: Pick<User, 'id' | 'username' | 'email'>;
  photos: HousekeepingPhoto[];
};

export async function listTasksForAdmin(
  adminId: number,
  filters: TaskFilters = {},
): Promise<TaskWithRelations[]> {
  const parsed = taskFiltersSchema.parse(filters);
  const where: Prisma.HousekeepingTaskWhereInput = { trip: { adminId } };
  if (parsed.status) where.status = parsed.status;
  if (parsed.housekeeperId) where.housekeeperId = parsed.housekeeperId;
  if (parsed.from || parsed.to) {
    where.date = {};
    if (parsed.from) where.date.gte = parsed.from;
    if (parsed.to) where.date.lte = parsed.to;
  }
  if (parsed.unpaidOnly) where.paid = false;
  return prisma.housekeepingTask.findMany({
    where,
    include: {
      trip: { include: { property: { select: { id: true, name: true } } } },
      housekeeper: { select: { id: true, username: true, email: true } },
      photos: { orderBy: { uploadedAt: 'asc' } },
    },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });
}

export async function listTasksForHousekeeper(
  housekeeperId: number,
  filters: Pick<TaskFilters, 'status' | 'from' | 'to'> = {},
): Promise<TaskWithRelations[]> {
  const where: Prisma.HousekeepingTaskWhereInput = { housekeeperId };
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = filters.from;
    if (filters.to) where.date.lte = filters.to;
  }
  return prisma.housekeepingTask.findMany({
    where,
    include: {
      trip: { include: { property: { select: { id: true, name: true } } } },
      housekeeper: { select: { id: true, username: true, email: true } },
      photos: { orderBy: { uploadedAt: 'asc' } },
    },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });
}

export async function getTaskById(id: number): Promise<TaskWithRelations | null> {
  return prisma.housekeepingTask.findUnique({
    where: { id },
    include: {
      trip: { include: { property: { select: { id: true, name: true } } } },
      housekeeper: { select: { id: true, username: true, email: true } },
      photos: { orderBy: { uploadedAt: 'asc' } },
    },
  });
}

export async function createTask(input: CreateTaskInput): Promise<HousekeepingTask> {
  const data = createTaskSchema.parse(input);
  return prisma.housekeepingTask.create({
    data: {
      tripId: data.tripId,
      housekeeperId: data.housekeeperId,
      date: data.date,
      payAmount: data.payAmount,
      notes: data.notes ?? null,
    },
  });
}

export async function createTaskForTrip(tripId: number): Promise<HousekeepingTask | null> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      property: {
        include: {
          housekeepers: { include: { housekeeper: { select: { id: true, deletedAt: true } } } },
          owner: { select: { defaultHousekeeperPay: true } },
        },
      },
    },
  });
  if (!trip) return null;
  const active = trip.property.housekeepers.filter((a) => a.housekeeper.deletedAt === null);
  if (active.length === 0) return null;
  const chosen = active.find((a) => a.isDefault) ?? active[0]!;
  const pay = chosen.payOverride ?? trip.property.owner.defaultHousekeeperPay;
  return prisma.housekeepingTask.create({
    data: {
      tripId: trip.id,
      housekeeperId: chosen.housekeeperId,
      date: trip.endDate,
      payAmount: pay,
      notes: null,
    },
  });
}

export async function reassignTask(id: number, input: ReassignInput): Promise<HousekeepingTask> {
  const data = reassignSchema.parse(input);
  return prisma.housekeepingTask.update({
    where: { id },
    data: {
      housekeeperId: data.housekeeperId,
      ...(data.payAmount ? { payAmount: data.payAmount } : {}),
    },
  });
}

export async function updateTaskStatus(
  id: number,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
): Promise<HousekeepingTask> {
  const data: Prisma.HousekeepingTaskUpdateInput = { status };
  if (status === 'IN_PROGRESS') data.startedAt = new Date();
  if (status === 'COMPLETED') data.completedAt = new Date();
  return prisma.housekeepingTask.update({ where: { id }, data });
}

export async function markPaid(id: number, paid: boolean): Promise<HousekeepingTask> {
  return prisma.housekeepingTask.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null },
  });
}

export async function addPhoto(taskId: number, storageKey: string): Promise<HousekeepingPhoto> {
  return prisma.housekeepingPhoto.create({ data: { taskId, storageKey } });
}

export async function deletePhoto(photoId: number): Promise<void> {
  await prisma.housekeepingPhoto.delete({ where: { id: photoId } });
}

export async function deleteTask(id: number): Promise<void> {
  await prisma.housekeepingTask.delete({ where: { id } });
}

export async function countUnpaidForAdmin(adminId: number): Promise<number> {
  return prisma.housekeepingTask.count({
    where: { trip: { adminId }, paid: false, status: 'COMPLETED' },
  });
}
