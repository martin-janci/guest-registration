/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyIco" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyVat" TEXT,
ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "contactDescription" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactWebsite" TEXT,
ADD COLUMN     "customLine1" TEXT,
ADD COLUMN     "customLine2" TEXT,
ADD COLUMN     "customLine3" TEXT,
ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'd.M.y',
ADD COLUMN     "defaultHousekeeperPay" DECIMAL(10,2) NOT NULL DEFAULT 20,
ADD COLUMN     "photoRequiredAdults" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "photoRequiredChildren" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Backfill existing rows, then remove the transient default
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "maxGuests" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyHousekeeper" (
    "propertyId" INTEGER NOT NULL,
    "housekeeperId" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "payOverride" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyHousekeeper_pkey" PRIMARY KEY ("propertyId","housekeeperId")
);

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "Property_deletedAt_idx" ON "Property"("deletedAt");

-- CreateIndex
CREATE INDEX "PropertyHousekeeper_housekeeperId_idx" ON "PropertyHousekeeper"("housekeeperId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyHousekeeper" ADD CONSTRAINT "PropertyHousekeeper_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyHousekeeper" ADD CONSTRAINT "PropertyHousekeeper_housekeeperId_fkey" FOREIGN KEY ("housekeeperId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
