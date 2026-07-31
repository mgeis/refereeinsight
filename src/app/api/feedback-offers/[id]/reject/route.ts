import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

// POST /api/feedback-offers/[id]/reject  body: { reason: string }
// The recipient declines feedback — it never touches their report. A reason
// is required so there's an audit trail of what was turned down and why.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { reason } = await req.json().catch(() => ({ reason: undefined }));
  if (!reason?.trim()) return NextResponse.json({ error: "A reason is required to reject feedback." }, { status: 400 });

  const { id } = await params;
  const prisma = await getPrisma();

  const offer = await prisma.feedbackOffer.findUnique({
    where: { id: Number(id) },
    include: { toReport: true },
  });
  if (!offer || offer.toReport.userId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (offer.status !== "PENDING") return NextResponse.json({ error: "This feedback has already been decided." }, { status: 409 });

  await prisma.$transaction([
    prisma.feedbackOffer.update({
      where: { id: offer.id },
      data: { status: "REJECTED", rejectionReason: reason.trim(), decidedAt: new Date() },
    }),
    prisma.notification.updateMany({ where: { feedbackOfferId: offer.id, userId }, data: { readAt: new Date() } }),
  ]);

  logEvent("FEEDBACK_REJECTED", {
    offerId: offer.id, fromReportId: offer.fromReportId, toReportId: offer.toReportId, userId, reason: reason.trim(),
  });

  return NextResponse.json({ ok: true });
}
