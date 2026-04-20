import type { PropertyHousekeeper } from '@prisma/client';
import { prisma } from '@/db/client';
import { assignSchema, type AssignInput } from './schema';

export type AssignmentRow = PropertyHousekeeper & {
  housekeeper: { id: number; username: string; email: string; deletedAt: Date | null };
};

export async function listAssignments(propertyId: number): Promise<AssignmentRow[]> {
  return prisma.propertyHousekeeper.findMany({
    where: { propertyId },
    include: {
      housekeeper: {
        select: { id: true, username: true, email: true, deletedAt: true },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { housekeeper: { username: 'asc' } }],
  });
}

export async function assign(input: AssignInput): Promise<PropertyHousekeeper> {
  const data = assignSchema.parse(input);
  return prisma.propertyHousekeeper.upsert({
    where: {
      propertyId_housekeeperId: {
        propertyId: data.propertyId,
        housekeeperId: data.housekeeperId,
      },
    },
    create: {
      propertyId: data.propertyId,
      housekeeperId: data.housekeeperId,
      isDefault: data.isDefault ?? false,
      payOverride: data.payOverride ?? null,
    },
    update: {
      isDefault: data.isDefault ?? false,
      payOverride: data.payOverride ?? null,
    },
  });
}

export async function unassign(propertyId: number, housekeeperId: number): Promise<void> {
  await prisma.propertyHousekeeper.delete({
    where: { propertyId_housekeeperId: { propertyId, housekeeperId } },
  });
}

export async function setDefault(propertyId: number, housekeeperId: number): Promise<void> {
  await prisma.$transaction([
    prisma.propertyHousekeeper.updateMany({
      where: { propertyId },
      data: { isDefault: false },
    }),
    prisma.propertyHousekeeper.update({
      where: { propertyId_housekeeperId: { propertyId, housekeeperId } },
      data: { isDefault: true },
    }),
  ]);
}
