const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('../../db/generated/prisma');
const { reserveGooglePlaceRequest } = require('../dist/place-photos/place-photos.persistence.js');

test(
  'PostgreSQL atomically limits monthly reservations to 1000',
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
    try {
      await prisma.$transaction(async tx => {
        await tx.$executeRaw`
        CREATE TEMPORARY TABLE "GooglePlacesMonthlyUsage" (
          "month" text PRIMARY KEY, "requests" integer NOT NULL
        ) ON COMMIT DROP
      `;
        await tx.$executeRaw`
        INSERT INTO "GooglePlacesMonthlyUsage"
        VALUES (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM'), 998)
      `;
        const reservations = await Promise.all(
          Array.from({ length: 5 }, () => reserveGooglePlaceRequest(tx)),
        );
        assert.equal(reservations.filter(Boolean).length, 2);
        const rows = await tx.$queryRaw`SELECT "requests" FROM "GooglePlacesMonthlyUsage"`;
        assert.equal(rows[0].requests, 1000);
      });
    } finally {
      await prisma.$disconnect();
    }
  },
);
