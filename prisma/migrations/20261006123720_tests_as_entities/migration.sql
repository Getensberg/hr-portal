-- DropIndex
DROP INDEX "Test_courseId_key";

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "accessMode" "CourseAccessMode" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "category" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Тест',
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TestAccess" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TestAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestAccess_testId_userId_key" ON "TestAccess"("testId", "userId");

-- AddForeignKey
ALTER TABLE "TestAccess" ADD CONSTRAINT "TestAccess_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAccess" ADD CONSTRAINT "TestAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
