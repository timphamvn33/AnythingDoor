/*
  Warnings:

  - Added the required column `closeHrs` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logoUrl` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openHrs` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "categorry" TEXT[],
ADD COLUMN     "closeHrs" TEXT NOT NULL,
ADD COLUMN     "logoUrl" TEXT NOT NULL,
ADD COLUMN     "openHrs" TEXT NOT NULL;
