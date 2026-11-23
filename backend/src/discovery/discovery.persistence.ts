import { Prisma } from '@db/generated/prisma';

export type DiscoveryListing = {
  id: string;
  name: string;
  category: string[];
  latitude: number;
  longitude: number;
  address: string | null;
  website: string | null;
};

export async function upsertDiscoveredRestaurants(
  prisma: Pick<Prisma.TransactionClient, '$executeRaw'>,
  listings: DiscoveryListing[],
): Promise<void> {
  if (!listings.length) return;

  const uniqueListings = [...new Map(listings.map(entry => [entry.id, entry])).values()];
  await prisma.$executeRaw`
    INSERT INTO "DiscoveredRestaurant"
      ("id", "name", "category", "latitude", "longitude", "address", "website", "updatedAt")
    SELECT entry.id, entry.name, ARRAY(SELECT jsonb_array_elements_text(entry.category)),
      entry.latitude, entry.longitude, entry.address, entry.website, CURRENT_TIMESTAMP
    FROM jsonb_to_recordset(${JSON.stringify(uniqueListings)}::jsonb)
      AS entry(id text, name text, category jsonb, latitude double precision,
               longitude double precision, address text, website text)
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "category" = EXCLUDED."category",
      "latitude" = EXCLUDED."latitude",
      "longitude" = EXCLUDED."longitude",
      "address" = EXCLUDED."address",
      "website" = EXCLUDED."website",
      "updatedAt" = EXCLUDED."updatedAt"
  `;
}
