import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, resolveBearerToken } from "@/lib/apiAuth";
import { createMatchReport, listMatchReportsForApi } from "@/lib/matchReports";
import { logEvent } from "@/lib/events";

// GET /api/v1/match-reports?page=1&limit=20&homeTeam=&awayTeam=&league=&ageGroup=&date=
// Bearer-token REST API for external clients — same tokens as the MCP server
// (generate one from Profile → Access Tokens). Returns your own reports, or
// every referee's for an administrator token.
export async function GET(req: NextRequest) {
  const caller = await resolveBearerToken(extractBearerToken(req));
  if (!caller) return NextResponse.json({ error: "Invalid or missing bearer token." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));

  const result = await listMatchReportsForApi({
    userId: caller.userId,
    isAdmin: caller.isAdmin,
    page,
    limit,
    filters: {
      homeTeam: sp.get("homeTeam") ?? undefined,
      awayTeam: sp.get("awayTeam") ?? undefined,
      league: sp.get("league") ?? undefined,
      ageGroup: sp.get("ageGroup") ?? undefined,
      date: sp.get("date") ?? undefined,
    },
  });

  logEvent("API_REPORTS_LISTED", { userId: caller.userId });

  return NextResponse.json(result);
}

// POST /api/v1/match-reports — create a new report.
// body.matchId set     -> attach report to an existing match
// body.match {...} set -> create a new match, then attach the report
// misconducts (optional) are only accepted when the report's position is Referee
export async function POST(req: NextRequest) {
  const caller = await resolveBearerToken(extractBearerToken(req));
  if (!caller) return NextResponse.json({ error: "Invalid or missing bearer token." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const result = await createMatchReport(caller.userId, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { report } = result;
  logEvent("API_REPORT_CREATED", { userId: caller.userId, reportId: report.id, matchId: report.matchId, homeTeam: report.match.homeTeam, awayTeam: report.match.awayTeam });

  return NextResponse.json(report, { status: 201 });
}
