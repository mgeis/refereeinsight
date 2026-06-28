import Link from "next/link";

const STAT_CARDS = [
  { label: "Total Reports", value: "0", sub: "Match reports submitted" },
  { label: "Matches Refereed", value: "0", sub: "As center referee" },
  { label: "Avg Score", value: "—", sub: "Performance rating" },
  { label: "This Season", value: "0", sub: "Reports this season" },
];

export default function DashboardPage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map((card) => (
          <div key={card.label} style={{
            background: "rgba(0,20,50,0.6)",
            border: "1px solid rgba(0,150,255,0.14)",
            borderRadius: "12px",
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", background: "radial-gradient(circle at top right, rgba(0,180,255,0.08), transparent 70%)" }} />
            <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(120,170,220,0.6)", marginBottom: "10px" }}>{card.label.toUpperCase()}</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#e8f4ff", lineHeight: 1, marginBottom: "6px" }}>{card.value}</div>
            <div style={{ fontSize: "12px", color: "rgba(100,150,200,0.5)" }}>{card.sub}</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)" }} />
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
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
      </div>
    </div>
  );
}
