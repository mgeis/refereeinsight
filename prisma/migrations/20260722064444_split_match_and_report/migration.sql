-- Split MatchReport into Match (game facts, shared) + MatchReport (personal
-- report). Existing rows are 1:1 today, so this migration creates exactly
-- one new Match per existing MatchReport and rewires Misconduct to point at
-- the Match instead of the MatchReport.

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "matchDate" DATE NOT NULL,
    "matchTime" TIME NOT NULL,
    "location" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "refereeCrewName" TEXT,
    "ar1CrewName" TEXT,
    "ar2CrewName" TEXT,
    "fourthCrewName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");

-- AlterTable: add nullable matchId columns first, backfill below, then enforce NOT NULL
ALTER TABLE "MatchReport" ADD COLUMN "matchId" INTEGER;
ALTER TABLE "Misconduct" ADD COLUMN "matchId" INTEGER;

-- Data migration: one Match per existing MatchReport, row-by-row so the
-- (report -> new match) correlation is unambiguous (no reliance on
-- INSERT...SELECT...RETURNING row ordering).
DO $$
DECLARE
  r RECORD;
  new_match_id INTEGER;
BEGIN
  FOR r IN SELECT * FROM "MatchReport" ORDER BY "id" LOOP
    INSERT INTO "Match" (
      "matchDate", "matchTime", "location", "homeTeam", "awayTeam",
      "league", "ageGroup", "refereeCrewName", "ar1CrewName", "ar2CrewName",
      "fourthCrewName", "updatedAt"
    )
    VALUES (
      r."matchDate", r."matchTime", r."location", r."homeTeam", r."awayTeam",
      r."league", r."ageGroup", r."refereeCrewName", r."ar1CrewName", r."ar2CrewName",
      r."fourthCrewName", CURRENT_TIMESTAMP
    )
    RETURNING "id" INTO new_match_id;

    UPDATE "MatchReport" SET "matchId" = new_match_id WHERE "id" = r."id";
    UPDATE "Misconduct" SET "matchId" = new_match_id WHERE "matchReportId" = r."id";
  END LOOP;
END $$;

-- Now that every row has a matchId, enforce constraints
ALTER TABLE "MatchReport" ALTER COLUMN "matchId" SET NOT NULL;
ALTER TABLE "Misconduct" ALTER COLUMN "matchId" SET NOT NULL;

-- Drop the columns that moved to Match
ALTER TABLE "MatchReport"
  DROP COLUMN "matchDate",
  DROP COLUMN "matchTime",
  DROP COLUMN "location",
  DROP COLUMN "homeTeam",
  DROP COLUMN "awayTeam",
  DROP COLUMN "league",
  DROP COLUMN "ageGroup",
  DROP COLUMN "refereeCrewName",
  DROP COLUMN "ar1CrewName",
  DROP COLUMN "ar2CrewName",
  DROP COLUMN "fourthCrewName";

-- Misconduct no longer references MatchReport directly
ALTER TABLE "Misconduct" DROP CONSTRAINT "Misconduct_matchReportId_fkey";
ALTER TABLE "Misconduct" DROP COLUMN "matchReportId";

-- CreateIndex
CREATE INDEX "MatchReport_matchId_idx" ON "MatchReport"("matchId");

-- CreateIndex: one report per user per match, and one report per position per match
CREATE UNIQUE INDEX "MatchReport_userId_matchId_key" ON "MatchReport"("userId", "matchId");
CREATE UNIQUE INDEX "MatchReport_matchId_positionId_key" ON "MatchReport"("matchId", "positionId");

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Misconduct" ADD CONSTRAINT "Misconduct_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
