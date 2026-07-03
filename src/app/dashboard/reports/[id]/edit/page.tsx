"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AutocompleteInput } from "@/components/AutocompleteInput";

const AGE_GROUPS = [
  "Adult / Open",
  "U19", "U18", "U17", "U16", "U15",
  "U14", "U13", "U12", "U11", "U10",
  "U9", "U8",
];

type Position = { id: number; name: string };

const CREW_FIELD: Record<string, string> = {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDateInput(d: any): string {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTimeInput(d: any): string {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString().slice(11, 16);
}

export default function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [location, setLocation] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [league, setLeague] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [naFlags, setNaFlags] = useState<Record<string, boolean>>({});
  const [crewNames, setCrewNames] = useState<Record<string, string>>({});
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

      setMatchDate(toDateInput(report.matchDate));
      setMatchTime(toTimeInput(report.matchTime));
      setLocation(report.location ?? "");
      setHomeTeam(report.homeTeam ?? "");
      setAwayTeam(report.awayTeam ?? "");
      setLeague(report.league ?? "");
      setAgeGroup(report.ageGroup ?? "");
      setSelectedPositionId(report.positionId);

      const posMap: Record<string, string> = {
        "Referee":             report.refereeCrewName  ?? "",
        "Assistant Referee 1": report.ar1CrewName      ?? "",
        "Assistant Referee 2": report.ar2CrewName      ?? "",
        "4th Official":        report.fourthCrewName   ?? "",
      };
      const naMap: Record<string, boolean> = {};
      for (const [pos, val] of Object.entries(posMap)) {
        if (val === "N/A") { naMap[pos] = true; posMap[pos] = ""; }
      }
      setCrewNames(posMap);
      setNaFlags(naMap);

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

  const selectedPosition = positions.find(p => p.id === selectedPositionId) ?? null;
  const crewPositions = positions.filter(p => p.id !== selectedPositionId);
  const activeCrew = crewPositions.filter(p => !naFlags[p.name] && crewNames[p.name]?.trim());

  function handlePositionChange(newId: number) {
    setSelectedPositionId(newId);
    setNaFlags({});
    setCrewNames({});
    setFeedbackFrom({});
    setFeedbackFor({});
  }

  function toggleNa(posName: string) {
    setNaFlags(prev => {
      const next = { ...prev, [posName]: !prev[posName] };
      if (next[posName]) {
        setCrewNames(c => ({ ...c, [posName]: "" }));
        setFeedbackFrom(c => ({ ...c, [posName]: "" }));
        setFeedbackFor(c => ({ ...c, [posName]: "" }));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    for (const pos of crewPositions) {
      const isNa = naFlags[pos.name];
      const name = crewNames[pos.name]?.trim();
      if (!isNa && !name) { setError(`Please enter a name for ${pos.name}, or mark it N/A.`); return; }
      if (pos.name === "Referee" && isNa) { setError("The Referee field cannot be marked N/A."); return; }
    }

    setSubmitting(true);

    const crewPayload: Record<string, string | null> = {};
    const feedbackFromPayload: Record<string, string | null> = {};
    const feedbackForPayload: Record<string, string | null> = {};

    for (const pos of positions) {
      const isUser = pos.id === selectedPositionId;
      const isNa = naFlags[pos.name];
      crewPayload[CREW_FIELD[pos.name]] = isUser ? null : isNa ? "N/A" : (crewNames[pos.name]?.trim() ?? "N/A");
      feedbackFromPayload[FEEDBACK_FROM_FIELD[pos.name]] = isUser ? null : (feedbackFrom[pos.name]?.trim() || null);
      feedbackForPayload[FEEDBACK_FOR_FIELD[pos.name]] = isUser ? null : (feedbackFor[pos.name]?.trim() || null);
    }

    const payload = {
      matchDate, matchTime, location, homeTeam, awayTeam, league, ageGroup,
      positionId: selectedPositionId,
      ...crewPayload,
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

  if (loading) {
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
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>Update the details for this match.</p>
      </div>

      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", padding: "28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent)" }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Match Date">
              <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
            </Field>
            <Field label="Kick-off Time">
              <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
            </Field>
          </div>

          <Field label="Location / Venue">
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
          </Field>

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Home Team">
              <input type="text" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
            </Field>
            <Field label="Away Team">
              <input type="text" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="League / Competition">
              <input type="text" value={league} onChange={e => setLeague(e.target.value)} required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
            </Field>
            <Field label="Age Group">
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBlue} onBlur={blurBlue}>
                <option value="" style={{ background: "#071428" }}>Select age group…</option>
                {AGE_GROUPS.map(g => <option key={g} value={g} style={{ background: "#071428" }}>{g}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          <Field label="Your Position">
            <select value={selectedPositionId ?? ""} onChange={e => handlePositionChange(Number(e.target.value))} required style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBlue} onBlur={blurBlue}>
              <option value="" style={{ background: "#071428" }}>Select your position…</option>
              {positions.map(p => <option key={p.id} value={p.id} style={{ background: "#071428" }}>{p.name}</option>)}
            </select>
          </Field>

          {selectedPosition && (
            <div style={sectionStyle}>
              <SectionLabel>OFFICIATING CREW</SectionLabel>
              {crewPositions.map(pos => {
                const isReferee = pos.name === "Referee";
                const isNa = naFlags[pos.name] ?? false;
                return (
                  <div key={pos.id}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={labelStyle}>{pos.name.toUpperCase()}</span>
                      {!isReferee && (
                        <button type="button" onClick={() => toggleNa(pos.name)} style={{ fontSize: "10px", letterSpacing: "0.08em", padding: "3px 10px", borderRadius: "20px", border: `1px solid ${isNa ? "rgba(0,210,255,0.5)" : "rgba(0,150,255,0.2)"}`, background: isNa ? "rgba(0,180,255,0.15)" : "transparent", color: isNa ? "#00d2ff" : "rgba(120,170,220,0.5)", cursor: "pointer" }}>
                          N/A
                        </button>
                      )}
                    </div>
                    <AutocompleteInput placeholder={`${pos.name} name`} disabled={isNa} value={isNa ? "" : (crewNames[pos.name] ?? "")} onChange={val => setCrewNames(prev => ({ ...prev, [pos.name]: val }))} />
                  </div>
                );
              })}
            </div>
          )}

          {activeCrew.length > 0 && (
            <div style={sectionStyle}>
              <SectionLabel>CREW FEEDBACK</SectionLabel>
              {activeCrew.map(pos => (
                <div key={pos.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "rgba(140,180,220,0.6)", paddingBottom: "4px", borderBottom: "1px solid rgba(0,100,200,0.12)" }}>
                    {crewNames[pos.name]} ({pos.name})
                  </div>
                  <Field label={`Feedback from ${crewNames[pos.name]}`}>
                    <textarea placeholder="What feedback did they give you?" value={feedbackFrom[pos.name] ?? ""} onChange={e => setFeedbackFrom(p => ({ ...p, [pos.name]: e.target.value }))} style={{ ...textareaStyle, minHeight: "80px" }} onFocus={focusBlue} onBlur={blurBlue} />
                  </Field>
                  <Field label={`Your feedback for ${crewNames[pos.name]}`}>
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
