/*
  Warnings:

  - You are about to drop the column `categorry` on the `Restaurant` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Restaurant_ownerId_key";

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "categorry",
ADD COLUMN     "category" TEXT[];
