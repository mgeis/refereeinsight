import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

// DELETE /api/matches/[id]/misconducts/[misconductId] — referee-only, same as POST.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; misconductId: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id, misconductId } = await params;
  const matchId = Number(id);
  const prisma = await getPrisma();

  const refereeReport = await prisma.matchReport.findFirst({
    where: { matchId, userId, position: { name: "Referee" } },
  });
  if (!refereeReport) {
    return NextResponse.json({ error: "Only the referee's report for this match can remove misconducts." }, { status: 403 });
  }

  const misconduct = await prisma.misconduct.findFirst({ where: { id: Number(misconductId), matchId }, select: { id: true } });
  if (!misconduct) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.misconduct.delete({ where: { id: Number(misconductId) } });

  logEvent("MISCONDUCT_DELETED", { userId, matchId, misconductId: Number(misconductId) });

  return NextResponse.json({ deleted: true });
}
