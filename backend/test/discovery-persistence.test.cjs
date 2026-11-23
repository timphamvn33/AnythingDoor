const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('../../db/generated/prisma');
const { upsertDiscoveredRestaurants } = require('../dist/discovery/discovery.persistence.js');

test(
  'bulk upserts listings in PostgreSQL without touching persistent tables',
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
    try {
      await prisma.$transaction(async tx => {
        await tx.$executeRaw`
          CREATE TEMPORARY TABLE "DiscoveredRestaurant" (
            "id" text PRIMARY KEY, "name" text NOT NULL, "category" text[] NOT NULL,
            "latitude" double precision NOT NULL, "longitude" double precision NOT NULL,
            "address" text, "website" text, "updatedAt" timestamp(3) NOT NULL
          ) ON COMMIT DROP
        `;
        const listing = {
          id: 'node/1',
          name: "Joe's; DROP TABLE test",
          category: ['pizza', 'fast food'],
          latitude: 42.36,
          longitude: -71.06,
          address: null,
          website: null,
        };
        await upsertDiscoveredRestaurants(tx, []);
        await upsertDiscoveredRestaurants(tx, [
          listing,
          { ...listing, id: 'node/2', name: 'Cafe', category: [] },
          { ...listing, name: "Joe's updated", category: ['sushi'], address: 'Main St' },
        ]);
        let rows = await tx.$queryRaw`SELECT * FROM "DiscoveredRestaurant" ORDER BY "id"`;
        assert.equal(rows.length, 2);
        assert.equal(rows[0].name, "Joe's updated");
        assert.deepEqual(rows[0].category, ['sushi']);
        assert.equal(rows[0].address, 'Main St');
        assert.deepEqual(rows[1].category, []);
        assert.ok(rows[0].updatedAt instanceof Date);

        await upsertDiscoveredRestaurants(tx, [
          { ...listing, latitude: 42.5, website: 'https://example.com' },
        ]);
        rows = await tx.$queryRaw`SELECT * FROM "DiscoveredRestaurant" ORDER BY "id"`;
        assert.equal(rows[0].name, listing.name);
        assert.deepEqual(rows[0].category, listing.category);
        assert.equal(rows[0].latitude, 42.5);
        assert.equal(rows[0].address, null);
        assert.equal(rows[0].website, 'https://example.com');
        assert.equal(rows[1].name, 'Cafe');

        const batch = Array.from({ length: 500 }, (_, index) => ({
          ...listing,
          id: `way/${index}`,
          name: `Restaurant ${index}`,
        }));
        await upsertDiscoveredRestaurants(tx, batch);
        const counts =
          await tx.$queryRaw`SELECT COUNT(*)::int AS count FROM "DiscoveredRestaurant"`;
        assert.equal(counts[0].count, 502);
      });
    } finally {
      await prisma.$disconnect();
    }
  },
);
