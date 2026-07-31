import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

// GET /api/matches?q=<search>&date=YYYY-MM-DD — search matches to attach a report to.
// Matches aren't personal data (only reports are), so this searches across all
// users' matches — but excludes ones the current user has already reported on.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const date = sp.get("date");

  if (!q && !date) return NextResponse.json([]);

  const prisma = await getPrisma();
  const matches = await prisma.match.findMany({
    where: {
      matchReports: { none: { userId } },
      ...(date ? { matchDate: { gte: new Date(date), lte: new Date(date) } } : {}),
      ...(q ? {
        OR: [
          { homeTeam: { contains: q, mode: "insensitive" } },
          { awayTeam: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: { matchReports: { include: { position: true, user: { select: { firstName: true, lastName: true } } } } },
    orderBy: { matchDate: "desc" },
    take: 20,
  });

  return NextResponse.json(matches.map(m => ({
    id: m.id,
    matchDate: m.matchDate,
    matchTime: m.matchTime,
    location: m.location,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    league: m.league,
    ageGroup: m.ageGroup,
    refereeCrewName: m.refereeCrewName,
    ar1CrewName: m.ar1CrewName,
    ar2CrewName: m.ar2CrewName,
    fourthCrewName: m.fourthCrewName,
    reportedPositions: m.matchReports.map(r => ({ position: r.position.name, by: `${r.user.firstName} ${r.user.lastName}` })),
  })));
}
