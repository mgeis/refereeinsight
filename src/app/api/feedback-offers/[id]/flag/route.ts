import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

// POST /api/feedback-offers/[id]/flag  body: { reason: string }
// The recipient reports offered feedback to site admins — e.g. inappropriate
// or unprofessional content, or use of feedback for non-soccer purposes.
// Independent of accept/reject: flagging doesn't change the offer's status,
// so something can be flagged whether it's pending, accepted, or rejected.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { reason } = await req.json().catch(() => ({ reason: undefined }));
  if (!reason?.trim()) return NextResponse.json({ error: "A reason is required to flag feedback." }, { status: 400 });

  const { id } = await params;
  const prisma = await getPrisma();

  const offer = await prisma.feedbackOffer.findUnique({
    where: { id: Number(id) },
    include: { toReport: true, fromReport: { select: { userId: true } } },
  });
  if (!offer || offer.toReport.userId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.feedbackOffer.update({
    where: { id: offer.id },
    data: { flaggedAt: new Date(), flagReason: reason.trim() },
  });

  logEvent("FEEDBACK_FLAGGED", {
    offerId: offer.id, fromReportId: offer.fromReportId, toReportId: offer.toReportId,
    fromUserId: offer.fromReport.userId, toUserId: userId, reason: reason.trim(),
  });

  const admins = await prisma.user.findMany({
    where: { roles: { some: { name: "ADMINISTRATOR" } } },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        isAdminAlert: true,
        message: `Feedback was flagged for review: "${reason.trim()}"`,
        link: `/dashboard/reports/${offer.toReportId}`,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
