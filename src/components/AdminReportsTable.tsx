"use client";

import Link from "next/link";
import { MatchReportsTable, ReportColumn, BaseReport } from "@/components/MatchReportsTable";

type Position = { id: number; name: string };
type ReportUser = { id: number; firstName: string; lastName: string; username: string };
type Match = {
  matchDate: string;
  matchTime: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  ageGroup: string;
};
type Report = BaseReport & {
  match: Match;
  position: Position;
  user: ReportUser;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

const COLUMNS: ReportColumn<Report>[] = [
  {
    key: "matchDate", label: "Date", filterParam: "date", filterType: "date",
    cellStyle: { color: "#00d2ff", fontVariantNumeric: "tabular-nums" },
    render: r => (
      <Link href={`/dashboard/reports/${r.id}`} style={{ color: "inherit", textDecoration: "none" }}>
        {formatDate(r.match.matchDate)}
      </Link>
    ),
  },
  { key: "referee", label: "Referee", filterParam: "referee", render: r => `${r.user.firstName} ${r.user.lastName}` },
  {
    key: "location", label: "Location", filterParam: "location",
    cellStyle: { maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" },
    render: r => r.match.location,
  },
  { key: "homeTeam", label: "Home", filterParam: "homeTeam", render: r => r.match.homeTeam },
  { key: "awayTeam", label: "Away", filterParam: "awayTeam", render: r => r.match.awayTeam },
  { key: "league", label: "League", filterParam: "league", cellStyle: { color: "rgba(160,195,235,0.7)" }, render: r => r.match.league },
  { key: "ageGroup", label: "Age Group", filterParam: "ageGroup", cellStyle: { color: "rgba(160,195,235,0.7)" }, render: r => r.match.ageGroup },
];

export function AdminReportsTable() {
  return (
    <MatchReportsTable<Report>
      apiUrl="/api/admin/match-reports"
      columns={COLUMNS}
      getDetailHref={r => `/dashboard/reports/${r.id}`}
      subtitle={total => total > 0 ? `${total} report${total !== 1 ? "s" : ""} across all referees` : "No reports yet"}
    />
  );
}
