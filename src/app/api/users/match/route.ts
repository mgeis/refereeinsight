import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { findUserByFullName } from "@/lib/matchReports";

// GET /api/users/match?name=Full+Name — exact (case-insensitive) name match
// against registered users. Same lookup the report-creation flow itself uses
// to decide whether a crew member gets an auto-generated report, so the
// add-report form can show "share with them" UI that matches what will
// actually happen on submit.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json(null);

  const name = req.nextUrl.searchParams.get("name")?.trim();
  if (!name) return NextResponse.json(null);

  const match = await findUserByFullName(name);
  if (!match) return NextResponse.json(null);

  return NextResponse.json({ id: match.id, firstName: match.firstName, lastName: match.lastName });
}
