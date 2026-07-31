import { getPrisma } from "@/lib/db";

function parseName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

async function upsertColleague(userId: number, fullName: string | null | undefined) {
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

function strFilter(v: string | undefined): object | undefined {
  if (!v) return undefined;
  return { contains: v, mode: "insensitive" };
}

export async function findUserByFullName(fullName: string) {
  const prisma = await getPrisma();
  const { firstName, lastName } = parseName(fullName);
  return prisma.user.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName:  { equals: lastName,  mode: "insensitive" },
    },
  });
}

const POSITION_NAMES = ["Referee", "Assistant Referee 1", "Assistant Referee 2", "4th Official"] as const;
type PositionName = typeof POSITION_NAMES[number];

const CREW_NAME_FIELD: Record<PositionName, "refereeCrewName" | "ar1CrewName" | "ar2CrewName" | "fourthCrewName"> = {
  "Referee": "refereeCrewName",
  "Assistant Referee 1": "ar1CrewName",
  "Assistant Referee 2": "ar2CrewName",
  "4th Official": "fourthCrewName",
};

const FEEDBACK_FOR_FIELD: Record<PositionName, "feedbackForReferee" | "feedbackForAr1" | "feedbackForAr2" | "feedbackForFourth"> = {
  "Referee": "feedbackForReferee",
  "Assistant Referee 1": "feedbackForAr1",
  "Assistant Referee 2": "feedbackForAr2",
  "4th Official": "feedbackForFourth",
};

const FEEDBACK_FROM_FIELD: Record<PositionName, "feedbackFromReferee" | "feedbackFromAr1" | "feedbackFromAr2" | "feedbackFromFourth"> = {
  "Referee": "feedbackFromReferee",
  "Assistant Referee 1": "feedbackFromAr1",
  "Assistant Referee 2": "feedbackFromAr2",
  "4th Official": "feedbackFromFourth",
};

// Exported for the accept-offer route: given the position the *sender* held
// on the match, which field on the *recipient's* report their feedback fills.
export function feedbackFromFieldForPosition(positionName: string): string | null {
  return FEEDBACK_FROM_FIELD[positionName as PositionName] ?? null;
}

export type CreateMatchReportInput = {
  matchId?: number | string;
  match?: {
    matchDate: string;
    matchTime: string;
    location: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    ageGroup: string;
    refereeCrewName?: string | null;
    ar1CrewName?: string | null;
    ar2CrewName?: string | null;
    fourthCrewName?: string | null;
  };
  positionId: number | string;
  feedbackFromReferee?: string | null;
  feedbackFromAr1?: string | null;
  feedbackFromAr2?: string | null;
  feedbackFromFourth?: string | null;
  feedbackForReferee?: string | null;
  feedbackForAr1?: string | null;
  feedbackForAr2?: string | null;
  feedbackForFourth?: string | null;
  personalReflection?: string | null;
  wentWell1?: string | null;
  wentWell2?: string | null;
  wentWell3?: string | null;
  toImprove1?: string | null;
  toImprove2?: string | null;
  toImprove3?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  misconducts?: any[];
  // Keyed by full position name (e.g. "Assistant Referee 1") — only relevant
  // when creating a brand-new match, see the auto-report-generation note below.
  shareFeedback?: Record<string, boolean>;
};

export type CreateMatchReportResult =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: true; report: any }
  | { ok: false; status: number; error: string };

// Shared by the session-authenticated dashboard route (POST /api/match-reports)
// and the bearer-token REST API (POST /api/v1/match-reports) — one creator
// is always the report's own author, regardless of which surface it came in
// through.
export async function createMatchReport(userId: number, body: CreateMatchReportInput): Promise<CreateMatchReportResult> {
  const prisma = await getPrisma();
  const {
    matchId, match,
    positionId,
    feedbackFromReferee, feedbackFromAr1, feedbackFromAr2, feedbackFromFourth,
    feedbackForReferee,  feedbackForAr1,  feedbackForAr2,  feedbackForFourth,
    personalReflection,
    wentWell1, wentWell2, wentWell3,
    toImprove1, toImprove2, toImprove3,
    misconducts,
    shareFeedback,
  } = body;
  const isNewMatch = !matchId;

  if (!positionId || (!matchId && !match)) {
    return { ok: false, status: 400, error: "A position and a match (new or existing) are required." };
  }

  const position = await prisma.position.findUnique({ where: { id: Number(positionId) } });
  if (!position) return { ok: false, status: 400, error: "Invalid position." };
  const isReferee = position.name === "Referee";

  let resolvedMatchId: number;
  let crewNamesToRemember: (string | null | undefined)[] = [];

  if (matchId) {
    const existingMatch = await prisma.match.findUnique({ where: { id: Number(matchId) } });
    if (!existingMatch) return { ok: false, status: 404, error: "Match not found." };

    const alreadyReported = await prisma.matchReport.findUnique({
      where: { userId_matchId: { userId, matchId: existingMatch.id } },
    });
    if (alreadyReported) return { ok: false, status: 409, error: "You already have a report for this match." };

    resolvedMatchId = existingMatch.id;
    crewNamesToRemember = [existingMatch.refereeCrewName, existingMatch.ar1CrewName, existingMatch.ar2CrewName, existingMatch.fourthCrewName];
  } else {
    const { matchDate, matchTime, location, homeTeam, awayTeam, league, ageGroup, refereeCrewName, ar1CrewName, ar2CrewName, fourthCrewName } = match ?? {};
    if (!matchDate || !matchTime || !location || !homeTeam || !awayTeam || !league || !ageGroup) {
      return { ok: false, status: 400, error: "All match details are required." };
    }
    const createdMatch = await prisma.match.create({
      data: {
        matchDate: new Date(matchDate),
        matchTime: new Date(`1970-01-01T${matchTime}:00Z`),
        location, homeTeam, awayTeam, league, ageGroup,
        refereeCrewName: refereeCrewName ?? null,
        ar1CrewName:     ar1CrewName     ?? null,
        ar2CrewName:     ar2CrewName     ?? null,
        fourthCrewName:  fourthCrewName  ?? null,
      },
    });
    resolvedMatchId = createdMatch.id;
    crewNamesToRemember = [refereeCrewName, ar1CrewName, ar2CrewName, fourthCrewName];
  }

  await Promise.all(crewNamesToRemember.map(name => upsertColleague(userId, name)));

  let report;
  try {
    report = await prisma.matchReport.create({
      data: {
        userId, matchId: resolvedMatchId, positionId: Number(positionId),
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
      include: { match: true, position: true },
    });
  } catch {
    return { ok: false, status: 409, error: "Someone has already filed a report for this position on this match." };
  }

  if (isReferee && Array.isArray(misconducts) && misconducts.length > 0) {
    await prisma.misconduct.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: misconducts.map((m: any) => ({
        matchId: resolvedMatchId,
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

  // New-match only: every OTHER crew-name field that matches a real
  // registered user gets their own stub report on this same match — one
  // report per user, per the requirement that a referee's own report never
  // gets edited by anyone else. Any "feedback for" text is NOT copied onto
  // that stub directly; if the reporter opted to share it (shareFeedback),
  // it becomes a pending FeedbackOffer the recipient must accept.
  if (isNewMatch) {
    const reporter = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    const reporterName = reporter ? `${reporter.firstName} ${reporter.lastName}` : "A crew member";

    for (const posName of POSITION_NAMES) {
      if (posName === position.name) continue;

      const crewName = match?.[CREW_NAME_FIELD[posName]];
      if (!crewName || crewName === "N/A") continue;

      const matchedUser = await findUserByFullName(crewName);
      if (!matchedUser || matchedUser.id === userId) continue;

      const targetPosition = await prisma.position.findUnique({ where: { name: posName } });
      if (!targetPosition) continue;

      const alreadyExists = await prisma.matchReport.findUnique({
        where: { userId_matchId: { userId: matchedUser.id, matchId: resolvedMatchId } },
      });
      if (alreadyExists) continue;

      const autoReport = await prisma.matchReport.create({
        data: { userId: matchedUser.id, matchId: resolvedMatchId, positionId: targetPosition.id },
      });

      const feedbackText = body[FEEDBACK_FOR_FIELD[posName]];
      if (shareFeedback?.[posName] && feedbackText && feedbackText.trim()) {
        const offer = await prisma.feedbackOffer.create({
          data: { fromReportId: report.id, toReportId: autoReport.id, text: feedbackText.trim() },
        });
        await prisma.notification.create({
          data: {
            userId: matchedUser.id,
            kind: "feedback_offer",
            feedbackOfferId: offer.id,
            message: `${reporterName} offered feedback on your performance as ${posName} — accept it to include it on your report.`,
            link: "/dashboard/notifications",
          },
        });
      }
    }
  }

  return { ok: true, report };
}

export type ListMatchReportFilters = {
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  ageGroup?: string;
  date?: string;
};

// Shared by the MCP "list_match_reports" tool and GET /api/v1/match-reports —
// same access rule in both: your own reports, or every referee's for admins.
export async function listMatchReportsForApi(params: {
  userId: number;
  isAdmin: boolean;
  filters: ListMatchReportFilters;
  page: number;
  limit: number;
}) {
  const { userId, isAdmin, filters, page, limit } = params;
  const prisma = await getPrisma();
  const skip = (page - 1) * limit;

  const matchFilter = {
    ...(filters.date ? { matchDate: { gte: new Date(filters.date), lte: new Date(filters.date) } } : {}),
    ...(filters.homeTeam ? { homeTeam: strFilter(filters.homeTeam) } : {}),
    ...(filters.awayTeam ? { awayTeam: strFilter(filters.awayTeam) } : {}),
    ...(filters.league ? { league: strFilter(filters.league) } : {}),
    ...(filters.ageGroup ? { ageGroup: strFilter(filters.ageGroup) } : {}),
  };
  const where = {
    ...(isAdmin ? {} : { userId }),
    ...(Object.keys(matchFilter).length > 0 ? { match: matchFilter } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.matchReport.findMany({
      where,
      include: {
        position: true,
        match: { include: { _count: { select: { misconducts: true } } } },
        ...(isAdmin ? { user: { select: { firstName: true, lastName: true, username: true } } } : {}),
      },
      orderBy: [{ match: { matchDate: "desc" } }, { match: { matchTime: "desc" } }],
      skip,
      take: limit,
    }),
    prisma.matchReport.count({ where }),
  ]);

  const summaries = reports.map((r) => ({
    id: r.id,
    matchDate: r.match.matchDate.toISOString().slice(0, 10),
    location: r.match.location,
    homeTeam: r.match.homeTeam,
    awayTeam: r.match.awayTeam,
    league: r.match.league,
    ageGroup: r.match.ageGroup,
    position: r.position.name,
    misconductCount: r.match._count.misconducts,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(isAdmin ? { referee: (r as any).user } : {}),
  }));

  return { reports: summaries, total, page, limit, pages: Math.ceil(total / limit) };
}

// Shared by the MCP "get_match_report" tool and GET /api/v1/match-reports/[id].
export async function getMatchReportForApi(params: { userId: number; isAdmin: boolean; id: number }) {
  const { userId, isAdmin, id } = params;
  const prisma = await getPrisma();
  return prisma.matchReport.findFirst({
    where: isAdmin ? { id } : { id, userId },
    include: { position: true, match: { include: { misconducts: true } } },
  });
}
