-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "OrgPerson" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "managerId" TEXT,
    "linkedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgPerson_linkedUserId_key" ON "OrgPerson"("linkedUserId");

-- AddForeignKey
ALTER TABLE "OrgPerson" ADD CONSTRAINT "OrgPerson_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "OrgPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgPerson" ADD CONSTRAINT "OrgPerson_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
