import { PrismaClient } from '@prisma/client';
import argon2 from '@node-rs/argon2';

async function wipeDb(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.housekeepingPhoto.deleteMany(),
    prisma.housekeepingTask.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.guest.deleteMany(),
    prisma.registration.deleteMany(),
    prisma.job.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.calendar.deleteMany(),
    prisma.propertyHousekeeper.deleteMany(),
    prisma.property.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seedFlow(): Promise<{ confirmCode: string }> {
  const prisma = new PrismaClient();
  try {
    await wipeDb(prisma);

    const admin = await prisma.user.create({
      data: {
        username: 'e2e-admin',
        email: 'e2e-admin@example.com',
        passwordHash: await argon2.hash('admin-pass-1234'),
        role: 'ADMIN',
      },
    });

    const property = await prisma.property.create({
      data: {
        name: 'E2E Villa',
        owner: { connect: { id: admin.id } },
      },
    });

    const trip = await prisma.trip.create({
      data: {
        title: 'E2E stay',
        property: { connect: { id: property.id } },
        admin: { connect: { id: admin.id } },
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        maxGuests: 4,
        externalConfirmCode: 'E2ECODE',
        source: 'MANUAL',
      },
    });

    return { confirmCode: trip.externalConfirmCode! };
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedAdmin(): Promise<{
  username: string;
  password: string;
  adminId: number;
  propertyId: number;
  tripId: number;
}> {
  const prisma = new PrismaClient();
  const password = 'admin-pass-1234';
  try {
    await wipeDb(prisma);

    const admin = await prisma.user.create({
      data: {
        username: 'e2e-admin',
        email: 'e2e-admin@example.com',
        passwordHash: await argon2.hash(password),
        role: 'ADMIN',
      },
    });

    const property = await prisma.property.create({
      data: {
        name: 'E2E Villa',
        owner: { connect: { id: admin.id } },
      },
    });

    const trip = await prisma.trip.create({
      data: {
        title: 'E2E stay',
        property: { connect: { id: property.id } },
        admin: { connect: { id: admin.id } },
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        maxGuests: 4,
        source: 'MANUAL',
      },
    });

    return { username: admin.username, password, adminId: admin.id, propertyId: property.id, tripId: trip.id };
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedHousekeeper(): Promise<{
  username: string;
  password: string;
  taskId: number;
}> {
  const prisma = new PrismaClient();
  const password = 'hk-pass-1234';
  try {
    await wipeDb(prisma);

    const admin = await prisma.user.create({
      data: {
        username: 'e2e-admin',
        email: 'e2e-admin@example.com',
        passwordHash: await argon2.hash('admin-pass-1234'),
        role: 'ADMIN',
      },
    });

    const hk = await prisma.user.create({
      data: {
        username: 'e2e-housekeeper',
        email: 'e2e-hk@example.com',
        passwordHash: await argon2.hash(password),
        role: 'HOUSEKEEPER',
      },
    });

    const property = await prisma.property.create({
      data: {
        name: 'E2E Villa',
        owner: { connect: { id: admin.id } },
      },
    });

    await prisma.propertyHousekeeper.create({
      data: {
        propertyId: property.id,
        housekeeperId: hk.id,
        isDefault: true,
      },
    });

    const trip = await prisma.trip.create({
      data: {
        title: 'E2E stay',
        property: { connect: { id: property.id } },
        admin: { connect: { id: admin.id } },
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-05'),
        maxGuests: 4,
        source: 'MANUAL',
      },
    });

    const task = await prisma.housekeepingTask.create({
      data: {
        tripId: trip.id,
        housekeeperId: hk.id,
        date: new Date('2026-05-05'),
        status: 'PENDING',
        payAmount: '50.00',
      },
    });

    return { username: hk.username, password, taskId: task.id };
  } finally {
    await prisma.$disconnect();
  }
}
