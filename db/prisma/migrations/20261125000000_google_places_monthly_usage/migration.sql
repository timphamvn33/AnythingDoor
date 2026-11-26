CREATE TABLE "GooglePlacesMonthlyUsage" (
  "month" TEXT NOT NULL,
  "requests" INTEGER NOT NULL,
  CONSTRAINT "GooglePlacesMonthlyUsage_pkey" PRIMARY KEY ("month"),
  CONSTRAINT "GooglePlacesMonthlyUsage_requests_check" CHECK ("requests" BETWEEN 0 AND 1000)
);
