import { PrismaClient } from '@prisma/client';
import argon2 from '@node-rs/argon2';

export async function seedFlow(): Promise<{ confirmCode: string }> {
  const prisma = new PrismaClient();
  try {
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
