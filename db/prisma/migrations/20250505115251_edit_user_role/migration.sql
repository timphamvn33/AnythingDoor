-- 1. Create the enum (only if it doesn't exist already)
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('buyer', 'admin', 'driver', 'restaurant_owner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Alter the column to use Role[] with explicit casting
ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT ARRAY['buyer']::"Role"[],
  ALTER COLUMN "role" TYPE "Role"[]
  USING ARRAY[role]::text[]::"Role"[];