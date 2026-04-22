-- CreateEnum
CREATE TYPE "JobKind" AS ENUM ('AIRBNB_SYNC', 'INVOICE_OVERDUE_FLIP');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "kind" "JobKind" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_status_runAfter_idx" ON "Job"("status", "runAfter");

-- CreateIndex
CREATE INDEX "Job_kind_status_idx" ON "Job"("kind", "status");
