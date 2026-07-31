import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, resolveBearerToken } from "@/lib/apiAuth";
import { getMatchReportForApi } from "@/lib/matchReports";
import { logEvent } from "@/lib/events";

// GET /api/v1/match-reports/[id] — full detail including misconducts.
// Only reports the token's owner is authorized to see are returned — their
// own, or (for administrators) any referee's.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const caller = await resolveBearerToken(extractBearerToken(req));
  if (!caller) return NextResponse.json({ error: "Invalid or missing bearer token." }, { status: 401 });

  const { id } = await params;
  const report = await getMatchReportForApi({ userId: caller.userId, isAdmin: caller.isAdmin, id: Number(id) });
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

  logEvent("API_REPORT_VIEWED", { userId: caller.userId, reportId: Number(id) });

  return NextResponse.json(report);
}
