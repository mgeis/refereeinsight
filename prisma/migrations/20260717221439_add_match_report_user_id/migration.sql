/*
  Warnings:

  - Added the required column `userId` to the `MatchReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "MatchReport" ADD COLUMN     "userId" INTEGER;

-- Backfill: existing reports predate per-user scoping, so attribute them to
-- the "referee" seed user (the only user that existed when they were created),
-- falling back to the earliest-created user if that username isn't present.
UPDATE "MatchReport"
SET "userId" = COALESCE(
  (SELECT "id" FROM "User" WHERE "username" = 'referee' LIMIT 1),
  (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1)
)
WHERE "userId" IS NULL;

-- Now that every row has a value, enforce the constraint
ALTER TABLE "MatchReport" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "MatchReport_userId_idx" ON "MatchReport"("userId");

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
