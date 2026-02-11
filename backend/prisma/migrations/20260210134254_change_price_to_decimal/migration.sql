/*
  Warnings:

  - You are about to alter the column `price` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Added the required column `businessId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "bufferTimeAfter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bufferTimeBefore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "price" SET DEFAULT 0,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
