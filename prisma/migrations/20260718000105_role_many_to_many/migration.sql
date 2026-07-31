-- Redesign Role from a one-to-many (per-user assignment rows) to a proper
-- many-to-many: Role becomes a fixed set of 5 shared rows, joined to User
-- via Prisma's implicit m2m table, so "all users with role X" is a direct,
-- indexed lookup instead of filtering assignment rows by an enum column.

-- Capture existing per-user role assignments before restructuring
CREATE TEMP TABLE _tmp_role_backfill AS SELECT "userId", "name" FROM "Role";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_userId_fkey";

-- DropIndex
DROP INDEX "Role_userId_name_key";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "createdAt",
DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Seed the fixed set of 5 roles (REFEREE already exists as a row from the
-- prior migration; ON CONFLICT makes this safe either way)
INSERT INTO "Role" ("name") VALUES
  ('REFEREE'), ('ADMINISTRATOR'), ('ASSIGNOR'), ('MENTOR'), ('TEAM_STAFF')
ON CONFLICT ("name") DO NOTHING;

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Restore the captured assignments into the new join table
-- (Prisma implicit m2m: A = Role.id since "Role" < "User" alphabetically, B = User.id)
INSERT INTO "_RoleToUser" ("A", "B")
SELECT r."id", b."userId"
FROM _tmp_role_backfill b
JOIN "Role" r ON r."name" = b."name";
