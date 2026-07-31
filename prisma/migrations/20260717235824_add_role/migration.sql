-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('REFEREE', 'ADMINISTRATOR', 'ASSIGNOR', 'MENTOR', 'TEAM_STAFF');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" "RoleName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_userId_name_key" ON "Role"("userId", "name");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: the existing "referee" seed user actually is a referee.
INSERT INTO "Role" ("userId", "name")
SELECT "id", 'REFEREE' FROM "User" WHERE "username" = 'referee';
