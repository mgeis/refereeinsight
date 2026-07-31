import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { feedbackFromFieldForPosition } from "@/lib/matchReports";
import { logEvent } from "@/lib/events";

// POST /api/feedback-offers/[id]/accept — the recipient accepts feedback
// offered by another crew member, writing it onto their own report.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const prisma = await getPrisma();

  const offer = await prisma.feedbackOffer.findUnique({
    where: { id: Number(id) },
    include: { toReport: true, fromReport: { include: { position: true } } },
  });
  if (!offer || offer.toReport.userId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (offer.status !== "PENDING") return NextResponse.json({ error: "This feedback has already been decided." }, { status: 409 });

  const field = feedbackFromFieldForPosition(offer.fromReport.position.name);
  if (!field) return NextResponse.json({ error: "Could not determine which field to update." }, { status: 500 });

  await prisma.$transaction([
    prisma.matchReport.update({ where: { id: offer.toReportId }, data: { [field]: offer.text } as Record<string, string> }),
    prisma.feedbackOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED", decidedAt: new Date() } }),
    prisma.notification.updateMany({ where: { feedbackOfferId: offer.id, userId }, data: { readAt: new Date() } }),
  ]);

  logEvent("FEEDBACK_ACCEPTED", { offerId: offer.id, fromReportId: offer.fromReportId, toReportId: offer.toReportId, userId });

  return NextResponse.json({ ok: true });
}
