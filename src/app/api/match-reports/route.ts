import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

function parseName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

async function upsertColleague(userId: number, fullName: string) {
  if (!fullName || fullName === "N/A") return;
  const prisma = await getPrisma();
  const { firstName, lastName } = parseName(fullName);
  const existing = await prisma.colleague.findFirst({
    where: {
      userId,
      firstName: { equals: firstName, mode: "insensitive" },
      lastName:  { equals: lastName,  mode: "insensitive" },
    },
  });
  if (!existing) {
    await prisma.colleague.create({ data: { userId, firstName, lastName } });
  }
}

function str(v: string | null): object | undefined {
  if (!v) return undefined;
  return { contains: v, mode: "insensitive" };
}

// GET /api/match-reports?page=1&limit=20&date=&location=&homeTeam=&awayTeam=&league=&ageGroup=
export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip  = (page - 1) * limit;

  const dateParam = sp.get("date");
  const where = {
    ...(dateParam ? { matchDate: { gte: new Date(dateParam), lte: new Date(dateParam) } } : {}),
    ...(sp.get("location") ? { location: str(sp.get("location")) } : {}),
    ...(sp.get("homeTeam") ? { homeTeam: str(sp.get("homeTeam")) } : {}),
    ...(sp.get("awayTeam") ? { awayTeam: str(sp.get("awayTeam")) } : {}),
    ...(sp.get("league")   ? { league:   str(sp.get("league"))   } : {}),
    ...(sp.get("ageGroup") ? { ageGroup: str(sp.get("ageGroup")) } : {}),
  };

  const prisma = await getPrisma();
  const [reports, total] = await Promise.all([
    prisma.matchReport.findMany({
      where,
      include: { position: true },
      orderBy: [{ matchDate: "desc" }, { matchTime: "desc" }],
      skip,
      take: limit,
    }),
    prisma.matchReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/match-reports — create a new report
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

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
    misconducts,
  } = body;

  if (!matchDate || !matchTime || !location || !homeTeam || !awayTeam || !league || !ageGroup || !positionId) {
    return NextResponse.json({ error: "All required fields must be filled in." }, { status: 400 });
  }

  const report = await prisma.matchReport.create({
    data: {
      matchDate: new Date(matchDate),
      matchTime: new Date(`1970-01-01T${matchTime}:00Z`),
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
  });

  const uid = userId;
  await Promise.all([
    upsertColleague(uid, refereeCrewName),
    upsertColleague(uid, ar1CrewName),
    upsertColleague(uid, ar2CrewName),
    upsertColleague(uid, fourthCrewName),
  ]);

  if (Array.isArray(misconducts) && misconducts.length > 0) {
    await prisma.misconduct.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: misconducts.map((m: any) => ({
        matchReportId: report.id,
        type: m.type,
        recipientType: m.recipientType,
        minute: Number(m.minute),
        number: m.number || null,
        name: m.name,
        reason: m.reason,
        description: m.description || null,
      })),
    });
  }

  return NextResponse.json(report, { status: 201 });
}

// DELETE /api/match-reports  body: { ids: number[] }
export async function DELETE(req: NextRequest) {
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No ids provided." }, { status: 400 });
  }
  const prisma = await getPrisma();
  await prisma.matchReport.deleteMany({ where: { id: { in: ids.map(Number) } } });
  return NextResponse.json({ deleted: ids.length });
}
