-- CreateEnum
CREATE TYPE "HousekeepingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "HousekeepingTask" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "housekeeperId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "HousekeepingStatus" NOT NULL DEFAULT 'PENDING',
    "payAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousekeepingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousekeepingPhoto" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousekeepingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HousekeepingTask_housekeeperId_date_idx" ON "HousekeepingTask"("housekeeperId", "date");

-- CreateIndex
CREATE INDEX "HousekeepingTask_tripId_idx" ON "HousekeepingTask"("tripId");

-- CreateIndex
CREATE INDEX "HousekeepingTask_status_idx" ON "HousekeepingTask"("status");

-- CreateIndex
CREATE INDEX "HousekeepingTask_date_idx" ON "HousekeepingTask"("date");

-- CreateIndex
CREATE INDEX "HousekeepingPhoto_taskId_idx" ON "HousekeepingPhoto"("taskId");

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_housekeeperId_fkey" FOREIGN KEY ("housekeeperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingPhoto" ADD CONSTRAINT "HousekeepingPhoto_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HousekeepingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
