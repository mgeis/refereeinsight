import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  const report = await prisma.matchReport.findUnique({
    where: { id: Number(id) },
    include: { position: true, misconducts: { orderBy: { minute: "asc" } } },
  });
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(report);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  const body = await req.json();

  const {
    matchDate, matchTime, location, homeTeam, awayTeam,
    league, ageGroup, positionId,
    refereeCrewName, ar1CrewName, ar2CrewName, fourthCrewName,
    feedbackFromReferee, feedbackFromAr1, feedbackFromAr2, feedbackFromFourth,
    feedbackForReferee,  feedbackForAr1,  feedbackForAr2,  feedbackForFourth,
    personalReflection,
    wentWell1, wentWell2, wentWell3,
    toImprove1, toImprove2, toImprove3,
  } = body;

  const report = await prisma.matchReport.update({
    where: { id: Number(id) },
    data: {
      matchDate:  new Date(matchDate),
      matchTime:  new Date(`1970-01-01T${matchTime}:00Z`),
      location, homeTeam, awayTeam, league, ageGroup,
      positionId: Number(positionId),
      refereeCrewName:     refereeCrewName     ?? null,
      ar1CrewName:         ar1CrewName         ?? null,
      ar2CrewName:         ar2CrewName         ?? null,
      fourthCrewName:      fourthCrewName      ?? null,
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
    include: { position: true },
  });

  return NextResponse.json(report);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  await prisma.matchReport.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}
