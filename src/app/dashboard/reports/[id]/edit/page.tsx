"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Position = { id: number; name: string };

type Match = {
  matchDate: string;
  matchTime: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  ageGroup: string;
  refereeCrewName: string | null;
  ar1CrewName: string | null;
  ar2CrewName: string | null;
  fourthCrewName: string | null;
};

const CREW_FIELD: Record<string, keyof Match> = {
  "Referee":             "refereeCrewName",
  "Assistant Referee 1": "ar1CrewName",
  "Assistant Referee 2": "ar2CrewName",
  "4th Official":        "fourthCrewName",
};
const FEEDBACK_FROM_FIELD: Record<string, string> = {
  "Referee":             "feedbackFromReferee",
  "Assistant Referee 1": "feedbackFromAr1",
  "Assistant Referee 2": "feedbackFromAr2",
  "4th Official":        "feedbackFromFourth",
};
const FEEDBACK_FOR_FIELD: Record<string, string> = {
  "Referee":             "feedbackForReferee",
  "Assistant Referee 1": "feedbackForAr1",
  "Assistant Referee 2": "feedbackForAr2",
  "4th Official":        "feedbackForFourth",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(0,30,60,0.6)",
  border: "1px solid rgba(0,150,255,0.25)",
  borderRadius: "8px",
  padding: "11px 14px",
  color: "#e8f4ff",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "120px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: "1.5",
};
const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  color: "rgba(140,180,220,0.8)",
  marginBottom: "6px",
  display: "block",
};
const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "20px",
  background: "rgba(0,40,90,0.3)",
  border: "1px solid rgba(0,150,255,0.12)",
  borderRadius: "10px",
};

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", marginBottom: "4px" }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}
function focusBlue(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = "rgba(0,210,255,0.5)";
}
function blurBlue(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = "rgba(0,150,255,0.25)";
}

function formatMatchHeader(m: Match) {
  const date = new Date(m.matchDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  const time = new Date(m.matchTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  return `${m.homeTeam} vs ${m.awayTeam} — ${date}, ${time}`;
}

export default function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [feedbackFrom, setFeedbackFrom] = useState<Record<string, string>>({});
  const [feedbackFor, setFeedbackFor] = useState<Record<string, string>>({});
  const [personalReflection, setPersonalReflection] = useState("");
  const [wentWell, setWentWell] = useState(["", "", ""]);
  const [toImprove, setToImprove] = useState(["", "", ""]);

  useEffect(() => {
    Promise.all([
      fetch("/api/positions").then(r => r.json()),
      fetch(`/api/match-reports/${id}`).then(r => r.json()),
    ]).then(([posData, report]) => {
      setPositions(posData);
      setMatch(report.match);
      setSelectedPositionId(report.positionId);

      setFeedbackFrom({
        "Referee":             report.feedbackFromReferee ?? "",
        "Assistant Referee 1": report.feedbackFromAr1     ?? "",
        "Assistant Referee 2": report.feedbackFromAr2     ?? "",
        "4th Official":        report.feedbackFromFourth  ?? "",
      });
      setFeedbackFor({
        "Referee":             report.feedbackForReferee ?? "",
        "Assistant Referee 1": report.feedbackForAr1     ?? "",
        "Assistant Referee 2": report.feedbackForAr2     ?? "",
        "4th Official":        report.feedbackForFourth  ?? "",
      });
      setPersonalReflection(report.personalReflection ?? "");
      setWentWell([report.wentWell1 ?? "", report.wentWell2 ?? "", report.wentWell3 ?? ""]);
      setToImprove([report.toImprove1 ?? "", report.toImprove2 ?? "", report.toImprove3 ?? ""]);
      setLoading(false);
    }).catch(() => { setError("Failed to load report."); setLoading(false); });
  }, [id]);

  const crewPositions = positions.filter(p => p.id !== selectedPositionId);

  const existingCrewName = (posName: string): string | null => {
    if (!match) return null;
    return match[CREW_FIELD[posName]] ?? null;
  };

  const activeCrew = crewPositions.filter(p => {
    const name = existingCrewName(p.name);
    return name && name !== "N/A";
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const feedbackFromPayload: Record<string, string | null> = {};
    const feedbackForPayload: Record<string, string | null> = {};

    for (const pos of positions) {
      const isUser = pos.id === selectedPositionId;
      feedbackFromPayload[FEEDBACK_FROM_FIELD[pos.name]] = isUser ? null : (feedbackFrom[pos.name]?.trim() || null);
      feedbackForPayload[FEEDBACK_FOR_FIELD[pos.name]] = isUser ? null : (feedbackFor[pos.name]?.trim() || null);
    }

    const payload = {
      positionId: selectedPositionId,
      ...feedbackFromPayload,
      ...feedbackForPayload,
      personalReflection: personalReflection.trim() || null,
      wentWell1: wentWell[0].trim() || null,
      wentWell2: wentWell[1].trim() || null,
      wentWell3: wentWell[2].trim() || null,
      toImprove1: toImprove[0].trim() || null,
      toImprove2: toImprove[1].trim() || null,
      toImprove3: toImprove[2].trim() || null,
    };

    try {
      const res = await fetch(`/api/match-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push(`/dashboard/reports/${id}`);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save changes.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !match) {
    return (
      <div className="p-6 lg:p-10" style={{ color: "rgba(120,170,220,0.6)", fontSize: "14px" }}>
        Loading report…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl" style={{ backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "12px", color: "rgba(100,150,200,0.5)" }}>
        <Link href="/dashboard/reports" style={{ color: "rgba(0,180,255,0.7)", textDecoration: "none" }}>Match Reports</Link>
        <span>/</span>
        <Link href={`/dashboard/reports/${id}`} style={{ color: "rgba(0,180,255,0.7)", textDecoration: "none" }}>Report #{id}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      <div className="mb-8">
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Edit Match Report</h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>{formatMatchHeader(match)}</p>
      </div>

      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", padding: "28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent)" }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div style={sectionStyle}>
            <SectionLabel>MATCH DETAILS</SectionLabel>
            <p style={{ fontSize: "12px", color: "rgba(120,170,220,0.55)", margin: 0 }}>
              These details belong to the match and may be shared with other crew members&apos; reports, so they can&apos;t be edited here.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#e8f4ff" }}>
              <div><span style={labelStyle}>LOCATION</span>{match.location}</div>
              <div><span style={labelStyle}>LEAGUE</span>{match.league}</div>
              <div><span style={labelStyle}>AGE GROUP</span>{match.ageGroup}</div>
            </div>
          </div>

          <Field label="Your Position">
            <select value={selectedPositionId ?? ""} onChange={e => setSelectedPositionId(Number(e.target.value))} required style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBlue} onBlur={blurBlue}>
              <option value="" style={{ background: "#071428" }}>Select your position…</option>
              {positions.map(p => <option key={p.id} value={p.id} style={{ background: "#071428" }}>{p.name}</option>)}
            </select>
          </Field>

          <div style={sectionStyle}>
            <SectionLabel>OFFICIATING CREW</SectionLabel>
            {crewPositions.map(pos => {
              const name = existingCrewName(pos.name);
              return (
                <div key={pos.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={labelStyle}>{pos.name.toUpperCase()}</span>
                  <span style={{ fontSize: "14px", color: name && name !== "N/A" ? "#e8f4ff" : "rgba(120,160,200,0.4)" }}>{name || "—"}</span>
                </div>
              );
            })}
          </div>

          {activeCrew.length > 0 && (
            <div style={sectionStyle}>
              <SectionLabel>CREW FEEDBACK</SectionLabel>
              {activeCrew.map(pos => (
                <div key={pos.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "rgba(140,180,220,0.6)", paddingBottom: "4px", borderBottom: "1px solid rgba(0,100,200,0.12)" }}>
                    {existingCrewName(pos.name)} ({pos.name})
                  </div>
                  <Field label={`Feedback from ${existingCrewName(pos.name)}`}>
                    <textarea placeholder="What feedback did they give you?" value={feedbackFrom[pos.name] ?? ""} onChange={e => setFeedbackFrom(p => ({ ...p, [pos.name]: e.target.value }))} style={{ ...textareaStyle, minHeight: "80px" }} onFocus={focusBlue} onBlur={blurBlue} />
                  </Field>
                  <Field label={`Your feedback for ${existingCrewName(pos.name)}`}>
                    <textarea placeholder="Your notes on their performance…" value={feedbackFor[pos.name] ?? ""} onChange={e => setFeedbackFor(p => ({ ...p, [pos.name]: e.target.value }))} style={{ ...textareaStyle, minHeight: "80px" }} onFocus={focusBlue} onBlur={blurBlue} />
                  </Field>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          <Field label="Personal Reflection">
            <textarea placeholder="How did the match go overall?" value={personalReflection} onChange={e => setPersonalReflection(e.target.value)} style={textareaStyle} onFocus={focusBlue} onBlur={blurBlue} />
          </Field>

          <div style={sectionStyle}>
            <SectionLabel>THINGS THAT WENT WELL</SectionLabel>
            {wentWell.map((v, i) => (
              <Field key={i} label={`${i + 1}.`}>
                <input type="text" placeholder={`Thing that went well #${i + 1}`} value={v} onChange={e => setWentWell(w => w.map((x, j) => j === i ? e.target.value : x))} style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
              </Field>
            ))}
          </div>

          <div style={sectionStyle}>
            <SectionLabel>AREAS TO IMPROVE</SectionLabel>
            {toImprove.map((v, i) => (
              <Field key={i} label={`${i + 1}.`}>
                <input type="text" placeholder={`Area to improve #${i + 1}`} value={v} onChange={e => setToImprove(w => w.map((x, j) => j === i ? e.target.value : x))} style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
              </Field>
            ))}
          </div>

          {error && <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ff8080" }}>{error}</div>}

          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: "13px", borderRadius: "8px", background: submitting ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)", color: "#fff", fontWeight: 600, fontSize: "14px", letterSpacing: "0.06em", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : "0 0 20px rgba(0,120,255,0.25)", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "SAVING…" : "SAVE CHANGES"}
            </button>
            <Link href={`/dashboard/reports/${id}`} style={{ padding: "13px 20px", borderRadius: "8px", background: "transparent", color: "rgba(140,180,220,0.6)", fontSize: "14px", border: "1px solid rgba(0,150,255,0.2)", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
