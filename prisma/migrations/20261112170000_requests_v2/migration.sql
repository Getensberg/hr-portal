-- AlterEnum
ALTER TYPE "VacationType" ADD VALUE 'BUSINESS_TRIP';

-- AlterTable
ALTER TABLE "VacationEntry" ADD COLUMN "requestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VacationEntry_requestId_key" ON "VacationEntry"("requestId");

-- AddForeignKey
ALTER TABLE "VacationEntry" ADD CONSTRAINT "VacationEntry_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
