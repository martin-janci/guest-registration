import type { Property, User } from '@prisma/client';
import { prisma } from '@/db/client';
import {
  createPropertySchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from './schema';

export type PropertyWithOwner = Property & {
  owner: Pick<User, 'id' | 'username' | 'email'>;
};

export async function listProperties({
  includeDeleted = false,
}: { includeDeleted?: boolean } = {}): Promise<PropertyWithOwner[]> {
  return prisma.property.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    include: { owner: { select: { id: true, username: true, email: true } } },
    orderBy: [{ deletedAt: 'asc' }, { name: 'asc' }],
  });
}

export async function getPropertyById(id: number): Promise<PropertyWithOwner | null> {
  return prisma.property.findUnique({
    where: { id },
    include: { owner: { select: { id: true, username: true, email: true } } },
  });
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const data = createPropertySchema.parse(input);
  return prisma.property.create({
    data: {
      ...data,
      maxGuests: data.maxGuests ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateProperty(id: number, input: UpdatePropertyInput): Promise<Property> {
  const data = updatePropertySchema.parse(input);
  return prisma.property.update({
    where: { id },
    data: {
      ...data,
      maxGuests: data.maxGuests ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function softDeleteProperty(id: number): Promise<Property> {
  return prisma.property.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreProperty(id: number): Promise<Property> {
  return prisma.property.update({
    where: { id },
    data: { deletedAt: null },
  });
}
