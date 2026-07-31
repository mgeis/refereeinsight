import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { logEvent } from "@/lib/events";
import { MisconductSection } from "@/components/MisconductSection";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.55)", fontWeight: 600 }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: "14px", color: value && value !== "N/A" ? "#e8f4ff" : "rgba(120,160,200,0.4)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,100,200,0.12)", fontSize: "10px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.55)", fontWeight: 600 }}>
        {label.toUpperCase()}
      </span>
      <p style={{ fontSize: "14px", color: "#e8f4ff", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
        {value}
      </p>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: (string | null | undefined)[] }) {
  const filtered = items.filter(Boolean) as string[];
  if (!filtered.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.55)", fontWeight: 600 }}>
        {label.toUpperCase()}
      </span>
      <ul style={{ margin: 0, paddingLeft: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
        {filtered.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: "10px", fontSize: "14px", color: "#e8f4ff" }}>
            <span style={{ color: "rgba(0,180,255,0.5)", flexShrink: 0, marginTop: "1px" }}>›</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");

  const { id } = await params;
  const prisma = await getPrisma();
  const report = await prisma.matchReport.findFirst({
    where: isAdmin ? { id: Number(id) } : { id: Number(id), userId },
    include: { position: true, match: { include: { misconducts: { orderBy: { minute: "asc" } } } } },
  });

  if (!report) notFound();

  if (isAdmin && report.userId !== userId) {
    logEvent("ADMIN_VIEWED_REPORT", { adminUserId: userId, reportId: report.id, reportOwnerId: report.userId });
  }

  const crewRows: { label: string; crewName: string | null; feedbackFrom: string | null; feedbackFor: string | null }[] = [
    { label: "Referee",             crewName: report.match.refereeCrewName, feedbackFrom: report.feedbackFromReferee, feedbackFor: report.feedbackForReferee },
    { label: "Assistant Referee 1", crewName: report.match.ar1CrewName,     feedbackFrom: report.feedbackFromAr1,     feedbackFor: report.feedbackForAr1     },
    { label: "Assistant Referee 2", crewName: report.match.ar2CrewName,     feedbackFrom: report.feedbackFromAr2,     feedbackFor: report.feedbackForAr2     },
    { label: "4th Official",        crewName: report.match.fourthCrewName,  feedbackFrom: report.feedbackFromFourth,  feedbackFor: report.feedbackForFourth  },
  ];

  const userPositionName = report.position.name;
  const hasFeedback = crewRows.some(r => r.label !== userPositionName && (r.feedbackFrom || r.feedbackFor));
  const canEditMisconducts = report.userId === userId && userPositionName === "Referee";

  return (
    <div className="p-6 lg:p-10 max-w-3xl" style={{ backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "12px", color: "rgba(100,150,200,0.5)" }}>
        <Link href="/dashboard/reports" style={{ color: "rgba(0,180,255,0.7)", textDecoration: "none" }}>Match Reports</Link>
        <span>/</span>
        <span>Report #{report.id}</span>
      </div>

      {/* Title + Edit button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px" }}>
        <div>
          <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
            {report.match.homeTeam} <span style={{ color: "rgba(120,170,220,0.5)", fontWeight: 400 }}>vs</span> {report.match.awayTeam}
          </h1>
          <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
            {formatDate(report.match.matchDate)} &nbsp;·&nbsp; {formatTime(report.match.matchTime)}
          </p>
        </div>
        {report.userId === userId && (
          <Link href={`/dashboard/reports/${report.id}/edit`} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 18px", borderRadius: "8px", flexShrink: 0,
            background: "rgba(0,80,160,0.4)", border: "1px solid rgba(0,150,255,0.3)",
            color: "rgba(0,210,255,0.9)", fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.06em", textDecoration: "none",
          }}>
            EDIT
          </Link>
        )}
      </div>

      {/* Match info card */}
      <Card title="MATCH DETAILS">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
          <DetailRow label="Date"      value={formatDate(report.match.matchDate)} />
          <DetailRow label="Kick-off"  value={formatTime(report.match.matchTime)} />
          <DetailRow label="Location"  value={report.match.location} />
          <DetailRow label="League"    value={report.match.league} />
          <DetailRow label="Age Group" value={report.match.ageGroup} />
          <DetailRow label="Home Team" value={report.match.homeTeam} />
          <DetailRow label="Away Team" value={report.match.awayTeam} />
        </div>
      </Card>

      {/* Crew card */}
      <Card title="OFFICIATING CREW">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
          {crewRows.map(({ label, crewName }) => {
            const isUserPosition = label === userPositionName;
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.55)", fontWeight: 600 }}>
                  {label.toUpperCase()}
                </span>
                {isUserPosition ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#00d2ff" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 6px #00d2ff", flexShrink: 0 }} />
                    You
                  </span>
                ) : (
                  <span style={{ fontSize: "14px", color: crewName && crewName !== "N/A" ? "#e8f4ff" : "rgba(120,160,200,0.35)" }}>
                    {crewName || "—"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Misconduct card */}
      <Card title="CAUTIONS &amp; SEND-OFFS">
        <MisconductSection
          matchId={report.matchId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialMisconducts={report.match.misconducts as any}
          readOnly={!canEditMisconducts}
        />
      </Card>

      {/* Feedback card */}
      {hasFeedback && (
        <Card title="CREW FEEDBACK">
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {crewRows.filter(r => r.label !== userPositionName && r.crewName && r.crewName !== "N/A" && (r.feedbackFrom || r.feedbackFor)).map(({ label, crewName, feedbackFrom, feedbackFor }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "rgba(140,180,220,0.6)", paddingBottom: "8px", borderBottom: "1px solid rgba(0,100,200,0.12)" }}>
                  {crewName} ({label})
                </div>
                {feedbackFrom && <TextBlock label={`Feedback from ${crewName}`} value={feedbackFrom} />}
                {feedbackFor && <TextBlock label={`Your feedback for ${crewName}`} value={feedbackFor} />}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reflection + lists */}
      {(report.personalReflection || report.wentWell1 || report.toImprove1) && (
        <Card title="REFLECTION &amp; GROWTH">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {report.personalReflection && <TextBlock label="Personal Reflection" value={report.personalReflection} />}
            <BulletList label="Things That Went Well" items={[report.wentWell1, report.wentWell2, report.wentWell3]} />
            <BulletList label="Areas to Improve" items={[report.toImprove1, report.toImprove2, report.toImprove3]} />
          </div>
        </Card>
      )}

      {/* Back link */}
      <div style={{ marginTop: "24px" }}>
        <Link href="/dashboard/reports" style={{ fontSize: "13px", color: "rgba(0,180,255,0.6)", textDecoration: "none" }}>
          ← Back to Match Reports
        </Link>
      </div>
    </div>
  );
}
