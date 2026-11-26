import { Prisma } from '@db/generated/prisma';

export async function reserveGooglePlaceRequest(
  prisma: Pick<Prisma.TransactionClient, '$queryRaw'>,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ requests: number }[]>`
    INSERT INTO "GooglePlacesMonthlyUsage" ("month", "requests")
    VALUES (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM'), 1)
    ON CONFLICT ("month") DO UPDATE
    SET "requests" = "GooglePlacesMonthlyUsage"."requests" + 1
    WHERE "GooglePlacesMonthlyUsage"."requests" < 1000
    RETURNING "requests"
  `;
  return rows.length > 0;
}
