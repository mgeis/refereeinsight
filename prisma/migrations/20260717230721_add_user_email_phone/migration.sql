-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Backfill: only existing user is the "referee" seed account
UPDATE "User" SET "email" = 'mgeis@yahoo.com' WHERE "username" = 'referee' AND "email" IS NULL;

-- Now that every row has a value, enforce the constraint
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
