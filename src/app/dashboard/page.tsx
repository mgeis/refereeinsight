import Link from "next/link";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const prisma = await getPrisma();
  const [totalReports, matchesRefereed, recentReports] = await Promise.all([
    prisma.matchReport.count(),
    prisma.matchReport.count({ where: { position: { name: "Referee" } } }),
    prisma.matchReport.findMany({
      take: 5,
      orderBy: { matchDate: "desc" },
      include: { position: true },
    }),
  ]);

  const statCards = [
    { label: "Total Reports",     value: String(totalReports),    sub: "Match reports submitted" },
    { label: "Matches Refereed",  value: String(matchesRefereed), sub: "As center referee" },
    { label: "Avg Score",         value: "—",                     sub: "Performance rating" },
    { label: "This Season",       value: "—",                     sub: "Reports this season" },
  ];

  return (
    <div
      className="p-6 lg:p-10"
      style={{ backgroundImage: "radial-gradient(ellipse 60% 40% at 60% 20%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}
    >
      <div className="mb-8">
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
          Welcome back
        </h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
          Here&apos;s an overview of your referee activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} style={{
            background: "rgba(0,20,50,0.6)",
            border: "1px solid rgba(0,150,255,0.14)",
            borderRadius: "12px",
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", background: "radial-gradient(circle at top right, rgba(0,180,255,0.08), transparent 70%)" }} />
            <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(120,170,220,0.6)", marginBottom: "10px" }}>
              {card.label.toUpperCase()}
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#e8f4ff", lineHeight: 1, marginBottom: "6px" }}>
              {card.value}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(100,150,200,0.5)" }}>{card.sub}</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)" }} />
          </div>
        ))}
      </div>

      {/* Recent reports */}
      <div style={{
        background: "rgba(0,20,50,0.6)",
        border: "1px solid rgba(0,150,255,0.14)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(0,150,255,0.1)",
        }}>
          <h2 style={{ color: "#e8f4ff", fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em" }}>
            RECENT MATCH REPORTS
          </h2>
          <Link
            href="/dashboard/add-report"
            style={{
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "#00d2ff",
              background: "rgba(0,150,255,0.1)",
              border: "1px solid rgba(0,150,255,0.25)",
              borderRadius: "6px",
              padding: "5px 12px",
              textDecoration: "none",
            }}
          >
            + ADD REPORT
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: "12px" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.25 }}>
              <circle cx="24" cy="24" r="22" stroke="#00d2ff" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="15" stroke="#00d2ff" strokeWidth="1" />
              <polygon points="24,12 28,18 26,24 22,24 20,18" fill="rgba(0,210,255,0.5)" />
              <polygon points="36,20 38,26 34,30 30,28 30,22" fill="rgba(0,210,255,0.5)" />
              <polygon points="12,20 10,26 14,30 18,28 18,22" fill="rgba(0,210,255,0.5)" />
            </svg>
            <p style={{ color: "rgba(120,170,220,0.4)", fontSize: "13px" }}>No match reports yet</p>
            <p style={{ color: "rgba(100,140,190,0.3)", fontSize: "12px" }}>Add your first report to get started</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,150,255,0.1)" }}>
                  {["Date", "Location", "Home", "Away", "League", "Age Group", "Position"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      color: "rgba(100,150,200,0.6)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: i < recentReports.length - 1 ? "1px solid rgba(0,100,200,0.08)" : "none",
                      transition: "background 0.1s",
                    }}
                  >
                    <td style={{ padding: "13px 16px", color: "#00d2ff", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {formatDate(r.matchDate)}
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(200,225,255,0.85)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.location}
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(200,225,255,0.85)", whiteSpace: "nowrap" }}>
                      {r.homeTeam}
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(200,225,255,0.85)", whiteSpace: "nowrap" }}>
                      {r.awayTeam}
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(160,195,235,0.7)", whiteSpace: "nowrap" }}>
                      {r.league}
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(160,195,235,0.7)", whiteSpace: "nowrap" }}>
                      {r.ageGroup}
                    </td>
                    <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: r.position.name === "Referee"
                          ? "rgba(0,180,255,0.15)"
                          : "rgba(80,120,200,0.12)",
                        border: `1px solid ${r.position.name === "Referee" ? "rgba(0,180,255,0.35)" : "rgba(80,120,200,0.25)"}`,
                        color: r.position.name === "Referee" ? "#00d2ff" : "rgba(140,180,230,0.8)",
                      }}>
                        {r.position.name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
