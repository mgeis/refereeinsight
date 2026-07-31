import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { createMatchReport } from "@/lib/matchReports";
import { logEvent } from "@/lib/events";

function str(v: string | null): object | undefined {
  if (!v) return undefined;
  return { contains: v, mode: "insensitive" };
}

function buildOrderBy(sortByParam: string | null, sortDir: "asc" | "desc") {
  switch (sortByParam) {
    case "location":  return [{ match: { location:  sortDir } }];
    case "homeTeam":  return [{ match: { homeTeam:  sortDir } }];
    case "awayTeam":  return [{ match: { awayTeam:  sortDir } }];
    case "league":    return [{ match: { league:    sortDir } }];
    case "ageGroup":  return [{ match: { ageGroup:  sortDir } }];
    case "matchDate": return [{ match: { matchDate: sortDir } }, { match: { matchTime: sortDir } }];
    default:          return [{ match: { matchDate: "desc" as const } }, { match: { matchTime: "desc" as const } }];
  }
}

// GET /api/match-reports?page=1&limit=20&date=&location=&homeTeam=&awayTeam=&league=&ageGroup=&sortBy=&sortDir=
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sp   = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip  = (page - 1) * limit;

  const dateParam = sp.get("date");
  const matchFilter = {
    ...(dateParam ? { matchDate: { gte: new Date(dateParam), lte: new Date(dateParam) } } : {}),
    ...(sp.get("location") ? { location: str(sp.get("location")) } : {}),
    ...(sp.get("homeTeam") ? { homeTeam: str(sp.get("homeTeam")) } : {}),
    ...(sp.get("awayTeam") ? { awayTeam: str(sp.get("awayTeam")) } : {}),
    ...(sp.get("league")   ? { league:   str(sp.get("league"))   } : {}),
    ...(sp.get("ageGroup") ? { ageGroup: str(sp.get("ageGroup")) } : {}),
  };
  const where = {
    userId,
    ...(Object.keys(matchFilter).length > 0 ? { match: matchFilter } : {}),
  };

  const sortDir: "asc" | "desc" = sp.get("sortDir") === "asc" ? "asc" : "desc";
  const orderBy = buildOrderBy(sp.get("sortBy"), sortDir);

  const prisma = await getPrisma();
  const [reports, total] = await Promise.all([
    prisma.matchReport.findMany({
      where,
      include: { position: true, match: { include: { _count: { select: { misconducts: true } } } } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.matchReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/match-reports — create a new report.
// body.matchId set          -> attach report to an existing match
// body.match {...} set      -> create a new match, then attach the report
// misconducts (optional) are only accepted when the report's position is Referee
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const result = await createMatchReport(userId, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { report } = result;
  logEvent("REPORT_CREATED", { userId, reportId: report.id, matchId: report.matchId, homeTeam: report.match.homeTeam, awayTeam: report.match.awayTeam });

  return NextResponse.json(report, { status: 201 });
}

// DELETE /api/match-reports  body: { ids: number[] }
export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No ids provided." }, { status: 400 });
  }
  const prisma = await getPrisma();
  const { count } = await prisma.matchReport.deleteMany({
    where: { id: { in: ids.map(Number) }, userId },
  });

  logEvent("REPORT_DELETED", { userId, reportIds: ids.map(Number), count });

  return NextResponse.json({ deleted: count });
}
