-- CreateEnum
CREATE TYPE "MisconductType" AS ENUM ('CAUTION', 'SENDOFF');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('PLAYER', 'TEAM_STAFF');

-- CreateTable
CREATE TABLE "Misconduct" (
    "id" SERIAL NOT NULL,
    "matchReportId" INTEGER NOT NULL,
    "type" "MisconductType" NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "minute" INTEGER NOT NULL,
    "number" TEXT,
    "name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Misconduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Misconduct" ADD CONSTRAINT "Misconduct_matchReportId_fkey" FOREIGN KEY ("matchReportId") REFERENCES "MatchReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
