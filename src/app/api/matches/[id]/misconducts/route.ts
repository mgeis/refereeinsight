import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

// POST /api/matches/[id]/misconducts — only the user whose report on this
// match has position "Referee" may add cautions/send-offs.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const matchId = Number(id);
  const prisma = await getPrisma();

  const refereeReport = await prisma.matchReport.findFirst({
    where: { matchId, userId, position: { name: "Referee" } },
  });
  if (!refereeReport) {
    return NextResponse.json({ error: "Only the referee's report for this match can add misconducts." }, { status: 403 });
  }

  const body = await req.json();
  const { type, recipientType, minute, number, name, reason, description } = body;

  if (!type || !recipientType || !minute || !name || !reason) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const misconduct = await prisma.misconduct.create({
    data: {
      matchId,
      type,
      recipientType,
      minute: Number(minute),
      number: number || null,
      name,
      reason,
      description: description || null,
    },
  });

  logEvent("MISCONDUCT_ADDED", { userId, matchId, misconductId: misconduct.id, type });

  return NextResponse.json(misconduct, { status: 201 });
}
