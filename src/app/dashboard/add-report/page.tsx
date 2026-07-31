"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { MisconductModal, MisconductData } from "@/components/MisconductModal";

const AGE_GROUPS = [
  "Adult / Open",
  "U19", "U18", "U17", "U16", "U15",
  "U14", "U13", "U12", "U11", "U10",
  "U9", "U8",
];

type Position = { id: number; name: string };

type MatchSearchResult = {
  id: number;
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
  reportedPositions: { position: string; by: string }[];
};

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

function formatMatchLabel(m: MatchSearchResult) {
  const date = new Date(m.matchDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  return `${m.homeTeam} vs ${m.awayTeam} — ${date} — ${m.league} (${m.ageGroup})`;
}

export default function AddReportPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [naFlags, setNaFlags] = useState<Record<string, boolean>>({});
  const [crewNames, setCrewNames] = useState<Record<string, string>>({});
  const [feedbackFrom, setFeedbackFrom] = useState<Record<string, string>>({});
  const [feedbackFor, setFeedbackFor] = useState<Record<string, string>>({});
  const [matchedUsers, setMatchedUsers] = useState<Record<string, { id: number; firstName: string; lastName: string } | null>>({});
  const [shareFeedback, setShareFeedback] = useState<Record<string, boolean>>({});
  const [wentWell, setWentWell] = useState(["", "", ""]);
  const [toImprove, setToImprove] = useState(["", "", ""]);
  const [personalReflection, setPersonalReflection] = useState("");
  const [misconducts, setMisconducts] = useState<MisconductData[]>([]);
  const [modalType, setModalType] = useState<"CAUTION" | "SENDOFF" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Existing-match search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MatchSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchSearchResult | null>(null);

  useEffect(() => {
    fetch("/api/positions").then(r => r.json()).then(setPositions).catch(() => {});
  }, []);

  // New-match mode only: for each other crew name typed, check whether it
  // matches a real registered user — that's who a "share this feedback"
  // checkbox and auto-generated report apply to on submit.
  useEffect(() => {
    if (mode !== "new") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const pos of positions) {
      if (pos.id === selectedPositionId) continue;
      const name = crewNames[pos.name]?.trim();
      if (!name || naFlags[pos.name]) {
        setMatchedUsers(prev => ({ ...prev, [pos.name]: null }));
        continue;
      }
      const t = setTimeout(() => {
        fetch(`/api/users/match?name=${encodeURIComponent(name)}`)
          .then(r => r.json())
          .then(u => setMatchedUsers(prev => ({ ...prev, [pos.name]: u })))
          .catch(() => {});
      }, 400);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, [mode, positions, selectedPositionId, crewNames, naFlags]);

  const runSearch = useCallback((query: string) => {
    setSearching(true);
    fetch(`/api/matches?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(setSearchResults)
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (mode !== "existing" || !searchQuery.trim()) return;
    const t = setTimeout(() => runSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [mode, searchQuery, runSearch]);

  function switchMode(next: "new" | "existing") {
    setMode(next);
    setSelectedMatch(null);
    setSelectedPositionId(null);
    setNaFlags({});
    setCrewNames({});
    setFeedbackFrom({});
    setFeedbackFor({});
    setMatchedUsers({});
    setShareFeedback({});
    setError("");
    setSearchQuery("");
    setSearchResults([]);
  }

  const selectedPosition = positions.find(p => p.id === selectedPositionId) ?? null;

  // Positions already claimed on the selected existing match can't be picked again.
  const takenPositionNames = new Set((selectedMatch?.reportedPositions ?? []).map(p => p.position));
  const availablePositions = mode === "existing"
    ? positions.filter(p => !takenPositionNames.has(p.name))
    : positions;

  const crewPositions = positions.filter(p => p.id !== selectedPositionId);

  // In "existing" mode, crew names come from the match (read-only) rather than being entered here.
  const existingCrewName = (posName: string): string | null => {
    if (!selectedMatch) return null;
    const field = CREW_FIELD[posName] as keyof MatchSearchResult;
    return (selectedMatch[field] as string | null) ?? null;
  };

  const activeCrew = crewPositions.filter(p => {
    if (mode === "existing") {
      const name = existingCrewName(p.name);
      return name && name !== "N/A";
    }
    return !naFlags[p.name] && crewNames[p.name]?.trim();
  });

  function toggleNa(posName: string) {
    setNaFlags(prev => {
      const next = { ...prev, [posName]: !prev[posName] };
      if (next[posName]) {
        setCrewNames(c => ({ ...c, [posName]: "" }));
        setFeedbackFrom(c => ({ ...c, [posName]: "" }));
        setFeedbackFor(c => ({ ...c, [posName]: "" }));
        setShareFeedback(c => ({ ...c, [posName]: false }));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (mode === "existing" && !selectedMatch) {
      setError("Select a match to attach your report to.");
      return;
    }
    if (!selectedPositionId) {
      setError("Select your position.");
      return;
    }

    if (mode === "new") {
      for (const pos of crewPositions) {
        const isNa = naFlags[pos.name];
        const name = crewNames[pos.name]?.trim();
        if (!isNa && !name) { setError(`Please enter a name for ${pos.name}, or mark it N/A.`); return; }
        if (pos.name === "Referee" && isNa) { setError("The Referee field cannot be marked N/A."); return; }
      }
    }

    setSubmitting(true);

    const form = e.currentTarget;
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value ?? "";

    const feedbackFromPayload: Record<string, string | null> = {};
    const feedbackForPayload: Record<string, string | null> = {};
    for (const pos of positions) {
      const isUser = pos.id === selectedPositionId;
      feedbackFromPayload[FEEDBACK_FROM_FIELD[pos.name]] = isUser ? null : (feedbackFrom[pos.name]?.trim() || null);
      feedbackForPayload[FEEDBACK_FOR_FIELD[pos.name]]   = isUser ? null : (feedbackFor[pos.name]?.trim()   || null);
    }

    const reportFields = {
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
      misconducts: selectedPosition?.name === "Referee" ? misconducts : [],
    };

    const payload = mode === "existing"
      ? { matchId: selectedMatch!.id, ...reportFields }
      : {
          match: {
            matchDate: get("matchDate"),
            matchTime: get("matchTime"),
            location: get("location"),
            homeTeam: get("homeTeam"),
            awayTeam: get("awayTeam"),
            league: get("league"),
            ageGroup: get("ageGroup"),
            refereeCrewName: naFlags["Referee"] ? "N/A" : (crewNames["Referee"]?.trim() || (selectedPosition?.name === "Referee" ? null : "N/A")),
            ar1CrewName:     selectedPosition?.name === "Assistant Referee 1" ? null : (naFlags["Assistant Referee 1"] ? "N/A" : (crewNames["Assistant Referee 1"]?.trim() || "N/A")),
            ar2CrewName:     selectedPosition?.name === "Assistant Referee 2" ? null : (naFlags["Assistant Referee 2"] ? "N/A" : (crewNames["Assistant Referee 2"]?.trim() || "N/A")),
            fourthCrewName:  selectedPosition?.name === "4th Official"       ? null : (naFlags["4th Official"]        ? "N/A" : (crewNames["4th Official"]?.trim()        || "N/A")),
          },
          shareFeedback,
          ...reportFields,
        };

    try {
      const res = await fetch("/api/match-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/reports"), 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to save report.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl" style={{ backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>
      <div className="mb-8">
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Add Match Report</h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>Record the details for a match you officiated.</p>
      </div>

      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", padding: "28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent)" }} />

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {(["new", "existing"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: "10px", borderRadius: "8px", cursor: "pointer",
                fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em",
                background: mode === m ? "linear-gradient(135deg, #0055cc, #0099ee)" : "transparent",
                color: mode === m ? "#fff" : "rgba(140,180,220,0.6)",
                border: `1px solid ${mode === m ? "transparent" : "rgba(0,150,255,0.2)"}`,
              }}
            >
              {m === "new" ? "NEW MATCH" : "EXISTING MATCH"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {mode === "existing" ? (
            <div style={sectionStyle}>
              <SectionLabel>FIND A MATCH</SectionLabel>
              <p style={{ fontSize: "12px", color: "rgba(120,170,220,0.55)", margin: 0 }}>
                Search for a match another crew member already logged, so you don&apos;t re-enter the same details.
              </p>
              {!selectedMatch ? (
                <>
                  <input
                    type="text"
                    placeholder="Search by team or location…"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      if (!e.target.value.trim()) setSearchResults([]);
                    }}
                    style={inputStyle}
                    onFocus={focusBlue}
                    onBlur={blurBlue}
                  />
                  {searching && <p style={{ fontSize: "12px", color: "rgba(120,170,220,0.5)", margin: 0 }}>Searching…</p>}
                  {!searching && searchQuery.trim() && searchResults.length === 0 && (
                    <p style={{ fontSize: "12px", color: "rgba(120,170,220,0.5)", margin: 0 }}>No matches found — check &quot;New Match&quot; instead.</p>
                  )}
                  {searchResults.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {searchResults.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setSelectedMatch(m); setSelectedPositionId(null); }}
                          style={{
                            textAlign: "left", padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                            background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.15)", color: "#e8f4ff", fontSize: "13px",
                          }}
                        >
                          {formatMatchLabel(m)}
                          {m.reportedPositions.length > 0 && (
                            <div style={{ fontSize: "11px", color: "rgba(120,170,220,0.55)", marginTop: "3px" }}>
                              Already reported: {m.reportedPositions.map(p => p.position).join(", ")}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ fontSize: "14px", color: "#e8f4ff" }}>{formatMatchLabel(selectedMatch)}</div>
                  <button type="button" onClick={() => { setSelectedMatch(null); setSelectedPositionId(null); }} style={{ fontSize: "11px", color: "rgba(0,180,255,0.7)", background: "none", border: "none", cursor: "pointer" }}>
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Date + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Match Date">
                  <input type="date" name="matchDate" required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
                </Field>
                <Field label="Kick-off Time">
                  <input type="time" name="matchTime" required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
                </Field>
              </div>

              <Field label="Location / Venue">
                <input type="text" name="location" placeholder="e.g. Riverside Park Field 3" required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
              </Field>

              <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Home Team">
                  <input type="text" name="homeTeam" placeholder="Home team name" required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
                </Field>
                <Field label="Away Team">
                  <input type="text" name="awayTeam" placeholder="Away team name" required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="League / Competition">
                  <input type="text" name="league" placeholder="e.g. AYSO Region 10" required style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
                </Field>
                <Field label="Age Group">
                  <select name="ageGroup" required style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBlue} onBlur={blurBlue}>
                    <option value="" style={{ background: "#071428" }}>Select age group…</option>
                    {AGE_GROUPS.map(g => <option key={g} value={g} style={{ background: "#071428" }}>{g}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          {/* Position */}
          <Field label="Your Position">
            <select
              name="positionId"
              required
              value={selectedPositionId ?? ""}
              onChange={e => setSelectedPositionId(Number(e.target.value))}
              disabled={mode === "existing" && !selectedMatch}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={focusBlue}
              onBlur={blurBlue}
            >
              <option value="" style={{ background: "#071428" }}>Select your position…</option>
              {availablePositions.map(p => <option key={p.id} value={p.id} style={{ background: "#071428" }}>{p.name}</option>)}
            </select>
            {mode === "existing" && selectedMatch && availablePositions.length === 0 && (
              <span style={{ fontSize: "11px", color: "#ff8080", marginTop: "6px" }}>Every position on this match already has a report.</span>
            )}
          </Field>

          {/* Crew (new-match mode: editable; existing-match mode: read-only, sourced from the match) */}
          {selectedPosition && mode === "new" && (
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

          {selectedPosition && mode === "existing" && (
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
          )}

          {/* Crew feedback — only shown when crew members have names */}
          {activeCrew.length > 0 && (
            <div style={sectionStyle}>
              <SectionLabel>CREW FEEDBACK</SectionLabel>
              <p style={{ fontSize: "12px", color: "rgba(120,170,220,0.55)", margin: 0 }}>
                Feedback here stays private to your own report unless you explicitly choose to share it below —
                shared feedback still needs that person&apos;s acceptance before it appears on their report. For
                notes you never want shared, use Personal Reflection / Went Well / Areas to Improve further down.
              </p>
              {activeCrew.map(pos => {
                const crewNameForPos = mode === "existing" ? (existingCrewName(pos.name) ?? "") : (crewNames[pos.name] ?? "");
                const matchedUser = mode === "new" ? matchedUsers[pos.name] : null;
                const hasFeedbackFor = !!feedbackFor[pos.name]?.trim();
                return (
                  <div key={pos.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "rgba(140,180,220,0.6)", paddingBottom: "4px", borderBottom: "1px solid rgba(0,100,200,0.12)" }}>
                      {crewNameForPos} ({pos.name})
                    </div>
                    <Field label={`Feedback from ${crewNameForPos}`}>
                      <textarea placeholder="What feedback did they give you?" value={feedbackFrom[pos.name] ?? ""} onChange={e => setFeedbackFrom(p => ({ ...p, [pos.name]: e.target.value }))} style={{ ...textareaStyle, minHeight: "80px" }} onFocus={focusBlue} onBlur={blurBlue} />
                    </Field>
                    <Field label={`Your feedback for ${crewNameForPos}`}>
                      <textarea placeholder="Your notes on their performance…" value={feedbackFor[pos.name] ?? ""} onChange={e => setFeedbackFor(p => ({ ...p, [pos.name]: e.target.value }))} style={{ ...textareaStyle, minHeight: "80px" }} onFocus={focusBlue} onBlur={blurBlue} />
                    </Field>
                    {matchedUser && hasFeedbackFor && (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(160,200,240,0.85)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={shareFeedback[pos.name] ?? false}
                          onChange={e => setShareFeedback(prev => ({ ...prev, [pos.name]: e.target.checked }))}
                          style={{ cursor: "pointer", accentColor: "#00d2ff", width: "14px", height: "14px" }}
                        />
                        Share this feedback with {matchedUser.firstName} {matchedUser.lastName}{" "}
                        (an account on Referee Insight) — they&apos;ll need to accept it before
                        it&apos;s added to their own report.
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          {/* Personal reflection */}
          <Field label="Personal Reflection">
            <textarea name="personalReflection" placeholder="How did the match go overall? What are your thoughts?" value={personalReflection} onChange={e => setPersonalReflection(e.target.value)} style={textareaStyle} onFocus={focusBlue} onBlur={blurBlue} />
          </Field>

          {/* Went well */}
          <div style={sectionStyle}>
            <SectionLabel>THINGS THAT WENT WELL</SectionLabel>
            {wentWell.map((v, i) => (
              <Field key={i} label={`${i + 1}.`}>
                <input type="text" placeholder={`Thing that went well #${i + 1}`} value={v} onChange={e => setWentWell(w => w.map((x, j) => j === i ? e.target.value : x))} style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
              </Field>
            ))}
          </div>

          {/* To improve */}
          <div style={sectionStyle}>
            <SectionLabel>AREAS TO IMPROVE</SectionLabel>
            {toImprove.map((v, i) => (
              <Field key={i} label={`${i + 1}.`}>
                <input type="text" placeholder={`Area to improve #${i + 1}`} value={v} onChange={e => setToImprove(w => w.map((x, j) => j === i ? e.target.value : x))} style={inputStyle} onFocus={focusBlue} onBlur={blurBlue} />
              </Field>
            ))}
          </div>

          {/* Cautions & Send-offs — only the Referee's own report can log these */}
          {selectedPosition?.name === "Referee" ? (
            <div style={sectionStyle}>
              <SectionLabel>CAUTIONS &amp; SEND-OFFS</SectionLabel>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalType("CAUTION")}
                  style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: "0.07em", background: "rgba(245,196,0,0.1)", border: "1px solid rgba(245,196,0,0.3)", color: "#f5c400" }}
                >
                  + CAUTION
                </button>
                <button
                  type="button"
                  onClick={() => setModalType("SENDOFF")}
                  style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: "0.07em", background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", color: "#ff4d4d" }}
                >
                  + SEND-OFF
                </button>
              </div>
              {misconducts.length === 0 ? (
                <p style={{ fontSize: "13px", color: "rgba(120,160,200,0.4)", fontStyle: "italic", margin: 0 }}>No cards added</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[...misconducts].sort((a, b) => a.minute - b.minute).map((m, i) => {
                    const isCaution = m.type === "CAUTION";
                    const accentColor = isCaution ? "#f5c400" : "#ff4d4d";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: isCaution ? "rgba(245,196,0,0.05)" : "rgba(255,77,77,0.05)", border: `1px solid ${isCaution ? "rgba(245,196,0,0.15)" : "rgba(255,77,77,0.15)"}` }}>
                        <div style={{ width: "14px", height: "20px", borderRadius: "2px", flexShrink: 0, background: accentColor, boxShadow: `0 0 8px ${accentColor}50` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8f4ff" }}>{m.name}{m.number ? ` #${m.number}` : ""} <span style={{ color: accentColor }}>{m.minute}&apos;</span></div>
                          <div style={{ fontSize: "12px", color: "rgba(140,180,220,0.55)", marginTop: "2px" }}>{m.reason}</div>
                        </div>
                        <button type="button" onClick={() => setMisconducts(prev => prev.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", color: "rgba(120,160,200,0.4)", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px 4px" }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedPosition && (
            <p style={{ fontSize: "12px", color: "rgba(120,170,220,0.5)", fontStyle: "italic" }}>
              Only the report filed as Referee can log cautions and send-offs for this match.
            </p>
          )}

          {error && <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ff8080" }}>{error}</div>}
          {success && <div style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#60d890" }}>Report saved! Redirecting…</div>}

          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: "13px", borderRadius: "8px", background: submitting ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)", color: "#fff", fontWeight: 600, fontSize: "14px", letterSpacing: "0.06em", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : "0 0 20px rgba(0,120,255,0.25)", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "SAVING…" : "SAVE REPORT"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard/reports")} style={{ padding: "13px 20px", borderRadius: "8px", background: "transparent", color: "rgba(140,180,220,0.6)", fontSize: "14px", border: "1px solid rgba(0,150,255,0.2)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {modalType && (
        <MisconductModal
          isOpen={true}
          type={modalType}
          onClose={() => setModalType(null)}
          onSubmit={data => {
            setMisconducts(prev => [...prev, data]);
            setModalType(null);
          }}
        />
      )}
    </div>
  );
}
