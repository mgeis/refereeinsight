import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const prisma = await getPrisma();
  const report = await prisma.matchReport.findFirst({
    where: { id: Number(id), userId },
    include: {
      position: true,
      match: { include: { misconducts: { orderBy: { minute: "asc" } } } },
    },
  });
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(report);
}

// PUT — updates report-specific fields only (position, feedback, reflection).
// Match-level facts (date, teams, location, crew) belong to Match, which may
// be shared with other users' reports, and aren't editable from here.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const prisma = await getPrisma();

  const existing = await prisma.matchReport.findFirst({ where: { id: Number(id), userId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();

  const {
    positionId,
    feedbackFromReferee, feedbackFromAr1, feedbackFromAr2, feedbackFromFourth,
    feedbackForReferee,  feedbackForAr1,  feedbackForAr2,  feedbackForFourth,
    personalReflection,
    wentWell1, wentWell2, wentWell3,
    toImprove1, toImprove2, toImprove3,
  } = body;

  let report;
  try {
    report = await prisma.matchReport.update({
      where: { id: Number(id) },
      data: {
        positionId: Number(positionId),
        feedbackFromReferee: feedbackFromReferee ?? null,
        feedbackFromAr1:     feedbackFromAr1     ?? null,
        feedbackFromAr2:     feedbackFromAr2     ?? null,
        feedbackFromFourth:  feedbackFromFourth  ?? null,
        feedbackForReferee:  feedbackForReferee  ?? null,
        feedbackForAr1:      feedbackForAr1      ?? null,
        feedbackForAr2:      feedbackForAr2      ?? null,
        feedbackForFourth:   feedbackForFourth   ?? null,
        personalReflection:  personalReflection  ?? null,
        wentWell1: wentWell1 ?? null,
        wentWell2: wentWell2 ?? null,
        wentWell3: wentWell3 ?? null,
        toImprove1: toImprove1 ?? null,
        toImprove2: toImprove2 ?? null,
        toImprove3: toImprove3 ?? null,
      },
      include: { position: true, match: true },
    });
  } catch {
    return NextResponse.json({ error: "Someone already has a report for that position on this match." }, { status: 409 });
  }

  logEvent("REPORT_UPDATED", { userId, reportId: report.id });

  return NextResponse.json(report);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const prisma = await getPrisma();
  const { count } = await prisma.matchReport.deleteMany({ where: { id: Number(id), userId } });
  if (count === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });

  logEvent("REPORT_DELETED", { userId, reportId: Number(id) });

  return NextResponse.json({ deleted: true });
}
