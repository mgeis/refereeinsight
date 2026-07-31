-- CreateEnum
CREATE TYPE "FeedbackOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "feedbackOfferId" INTEGER,
ADD COLUMN     "isAdminAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kind" TEXT;

-- CreateTable
CREATE TABLE "FeedbackOffer" (
    "id" SERIAL NOT NULL,
    "fromReportId" INTEGER NOT NULL,
    "toReportId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" "FeedbackOfferStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "flaggedAt" TIMESTAMP(3),
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackOffer_toReportId_idx" ON "FeedbackOffer"("toReportId");

-- CreateIndex
CREATE INDEX "Notification_feedbackOfferId_idx" ON "Notification"("feedbackOfferId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_feedbackOfferId_fkey" FOREIGN KEY ("feedbackOfferId") REFERENCES "FeedbackOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackOffer" ADD CONSTRAINT "FeedbackOffer_fromReportId_fkey" FOREIGN KEY ("fromReportId") REFERENCES "MatchReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackOffer" ADD CONSTRAINT "FeedbackOffer_toReportId_fkey" FOREIGN KEY ("toReportId") REFERENCES "MatchReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
