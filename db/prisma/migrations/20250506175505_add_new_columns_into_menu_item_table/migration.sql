/*
  Warnings:

  - Added the required column `imgUrl` to the `MenuItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imgUrl" TEXT NOT NULL;
