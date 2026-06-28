import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    matchDate, matchTime, location, homeTeam, awayTeam,
    league, ageGroup, positionId,
    refereeCrewName, ar1CrewName, ar2CrewName, fourthCrewName,
  } = body;

  if (!matchDate || !matchTime || !location || !homeTeam || !awayTeam || !league || !ageGroup || !positionId) {
    return NextResponse.json({ error: "All required fields must be filled in." }, { status: 400 });
  }

  const report = await prisma.matchReport.create({
    data: {
      matchDate: new Date(matchDate),
      matchTime: new Date(`1970-01-01T${matchTime}:00Z`),
      location,
      homeTeam,
      awayTeam,
      league,
      ageGroup,
      positionId: Number(positionId),
      refereeCrewName: refereeCrewName ?? null,
      ar1CrewName: ar1CrewName ?? null,
      ar2CrewName: ar2CrewName ?? null,
      fourthCrewName: fourthCrewName ?? null,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
