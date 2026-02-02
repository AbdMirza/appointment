/*
  Warnings:

  - The values [SUPER_ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('BUSINESS_ADMIN', 'STAFF', 'CUSTOMER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "businessId" TEXT,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
