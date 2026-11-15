CREATE TABLE "DiscoveredRestaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiscoveredRestaurant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscoveredRestaurant_latitude_longitude_idx" ON "DiscoveredRestaurant"("latitude", "longitude");
