-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('supply', 'rent', 'utilities', 'employees', 'insurance', 'certifications', 'tax', 'legal', 'other');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('hourly', 'salary');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('pto', 'sick');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'accepted';
ALTER TYPE "OrderStatus" ADD VALUE 'preparing';
ALTER TYPE "OrderStatus" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "establishedAt" DATE,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "comingSoon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ingredients" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "restaurantId" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "itemName" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- Only infer a restaurant when every item still points to the same restaurant.
UPDATE "Order" AS o
SET "restaurantId" = candidates."restaurantId"
FROM (
    SELECT oi."orderId", MIN(m."restaurantId") AS "restaurantId"
    FROM "OrderItem" AS oi
    LEFT JOIN "MenuItem" AS m ON m."id" = oi."menuItemId"
    GROUP BY oi."orderId"
    HAVING COUNT(*) = COUNT(m."restaurantId") AND COUNT(DISTINCT m."restaurantId") = 1
) AS candidates
WHERE o."id" = candidates."orderId";

-- CreateTable
CREATE TABLE "RestaurantHours" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "day" "Weekday" NOT NULL,
    "opensAt" TIME(0) NOT NULL,
    "closesAt" TIME(0) NOT NULL,

    CONSTRAINT "RestaurantHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantHoursException" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" TIME(0),
    "closesAt" TIME(0),

    CONSTRAINT "RestaurantHoursException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "cost" DECIMAL(12,2),
    "expiresAt" DATE,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "payType" "PayType" NOT NULL,
    "payRate" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkShift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),

    CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftBreak" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "ShiftBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'pending',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollAccount" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "lastFour" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_availability_check"
    CHECK (NOT ("available" AND "comingSoon"));
ALTER TABLE "Order" ADD CONSTRAINT "Order_submitted_restaurant_check"
    CHECK ("submittedAt" IS NULL OR "restaurantId" IS NOT NULL);
ALTER TABLE "RestaurantHoursException" ADD CONSTRAINT "RestaurantHoursException_times_check"
    CHECK (("isClosed" AND "opensAt" IS NULL AND "closesAt" IS NULL)
        OR (NOT "isClosed" AND "opensAt" IS NOT NULL AND "closesAt" IS NOT NULL));
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_values_check"
    CHECK ("quantity" >= 0 AND ("cost" IS NULL OR "cost" >= 0));
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_payRate_check" CHECK ("payRate" >= 0);
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_times_check"
    CHECK ("clockOut" IS NULL OR "clockOut" > "clockIn");
ALTER TABLE "ShiftBreak" ADD CONSTRAINT "ShiftBreak_times_check"
    CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_times_check" CHECK ("endsAt" > "startsAt");
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_values_check"
    CHECK ("periodEnd" > "periodStart" AND "amount" >= 0);

-- CreateIndex
CREATE INDEX "RestaurantHours_restaurantId_day_idx" ON "RestaurantHours"("restaurantId", "day");

-- CreateIndex
CREATE INDEX "RestaurantHoursException_restaurantId_date_idx" ON "RestaurantHoursException"("restaurantId", "date");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_restaurantId_incurredAt_idx" ON "Expense"("restaurantId", "incurredAt");

-- CreateIndex
CREATE INDEX "Supply_restaurantId_expiresAt_idx" ON "Supply"("restaurantId", "expiresAt");

-- CreateIndex
CREATE INDEX "Employee_restaurantId_isActive_idx" ON "Employee"("restaurantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_restaurantId_userId_key" ON "Employee"("restaurantId", "userId");

-- CreateIndex
CREATE INDEX "WorkShift_employeeId_clockIn_idx" ON "WorkShift"("employeeId", "clockIn");

-- CreateIndex
CREATE INDEX "ShiftBreak_shiftId_startsAt_idx" ON "ShiftBreak"("shiftId", "startsAt");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_startsAt_idx" ON "LeaveRequest"("employeeId", "startsAt");

-- CreateIndex
CREATE INDEX "PayrollAccount_employeeId_isActive_idx" ON "PayrollAccount"("employeeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollAccount_provider_providerAccountId_key" ON "PayrollAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "PayrollRecord_employeeId_periodStart_idx" ON "PayrollRecord"("employeeId", "periodStart");

-- CreateIndex
CREATE INDEX "Order_restaurantId_status_createdAt_idx" ON "Order"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Restaurant_ownerId_idx" ON "Restaurant"("ownerId");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");

-- AddForeignKey
ALTER TABLE "RestaurantHours" ADD CONSTRAINT "RestaurantHours_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantHoursException" ADD CONSTRAINT "RestaurantHoursException_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftBreak" ADD CONSTRAINT "ShiftBreak_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAccount" ADD CONSTRAINT "PayrollAccount_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
