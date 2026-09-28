-- CreateEnum
CREATE TYPE "VacationType" AS ENUM ('VACATION', 'DAY_OFF');

-- CreateEnum
CREATE TYPE "VacationStatus" AS ENUM ('PLANNED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "VacationEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VacationType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "VacationStatus" NOT NULL DEFAULT 'PLANNED',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyHoliday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CompanyHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedPeriod" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "BlockedPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyHoliday_date_key" ON "CompanyHoliday"("date");

-- AddForeignKey
ALTER TABLE "VacationEntry" ADD CONSTRAINT "VacationEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
