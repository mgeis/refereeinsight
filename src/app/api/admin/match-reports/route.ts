import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { userHasRole } from "@/lib/roles";

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
    case "referee":   return [{ user: { lastName: sortDir } }, { user: { firstName: sortDir } }];
    default:          return [{ match: { matchDate: "desc" as const } }, { match: { matchTime: "desc" as const } }];
  }
}

// GET /api/admin/match-reports — all referees' reports, ADMINISTRATOR only.
// Same shape as /api/match-reports plus an unscoped view and a "referee" filter/sort.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp   = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip  = (page - 1) * limit;

  const dateParam = sp.get("date");
  const refereeParam = sp.get("referee");
  const matchFilter = {
    ...(dateParam ? { matchDate: { gte: new Date(dateParam), lte: new Date(dateParam) } } : {}),
    ...(sp.get("location") ? { location: str(sp.get("location")) } : {}),
    ...(sp.get("homeTeam") ? { homeTeam: str(sp.get("homeTeam")) } : {}),
    ...(sp.get("awayTeam") ? { awayTeam: str(sp.get("awayTeam")) } : {}),
    ...(sp.get("league")   ? { league:   str(sp.get("league"))   } : {}),
    ...(sp.get("ageGroup") ? { ageGroup: str(sp.get("ageGroup")) } : {}),
  };
  const where = {
    ...(Object.keys(matchFilter).length > 0 ? { match: matchFilter } : {}),
    ...(refereeParam ? {
      user: {
        OR: [
          { firstName: { contains: refereeParam, mode: "insensitive" as const } },
          { lastName:  { contains: refereeParam, mode: "insensitive" as const } },
        ],
      },
    } : {}),
  };

  const sortDir: "asc" | "desc" = sp.get("sortDir") === "asc" ? "asc" : "desc";
  const orderBy = buildOrderBy(sp.get("sortBy"), sortDir);

  const prisma = await getPrisma();
  const [reports, total] = await Promise.all([
    prisma.matchReport.findMany({
      where,
      include: {
        position: true,
        match: true,
        user: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.matchReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total, page, limit, pages: Math.ceil(total / limit) });
}
