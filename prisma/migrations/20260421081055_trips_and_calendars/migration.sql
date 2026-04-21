-- CreateEnum
CREATE TYPE "TripSource" AS ENUM ('MANUAL', 'AIRBNB_ICS', 'WEBHOOK');

-- CreateTable
CREATE TABLE "Calendar" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icsUrl" TEXT NOT NULL,
    "syncIntervalMin" INTEGER NOT NULL DEFAULT 60,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "calendarId" INTEGER,
    "source" "TripSource" NOT NULL DEFAULT 'MANUAL',
    "externalReservationId" TEXT,
    "externalConfirmCode" TEXT,
    "externalGuestName" TEXT,
    "externalGuestEmail" TEXT,
    "externalGuestCount" INTEGER,
    "externalSyncedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Calendar_propertyId_idx" ON "Calendar"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_externalReservationId_key" ON "Trip"("externalReservationId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_externalConfirmCode_key" ON "Trip"("externalConfirmCode");

-- CreateIndex
CREATE INDEX "Trip_propertyId_startDate_idx" ON "Trip"("propertyId", "startDate");

-- CreateIndex
CREATE INDEX "Trip_adminId_startDate_idx" ON "Trip"("adminId", "startDate");

-- CreateIndex
CREATE INDEX "Trip_calendarId_idx" ON "Trip"("calendarId");

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
