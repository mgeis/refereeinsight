"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AGE_GROUPS = [
  "Adult / Open",
  "U19", "U18", "U17", "U16", "U15",
  "U14", "U13", "U12", "U11", "U10",
  "U9", "U8",
];

type Position = { id: number; name: string };

// Maps position name → the crew field key sent to the API
const CREW_FIELD: Record<string, string> = {
  "Referee":             "refereeCrewName",
  "Assistant Referee 1": "ar1CrewName",
  "Assistant Referee 2": "ar2CrewName",
  "4th Official":        "fourthCrewName",
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

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  opacity: 0.35,
  cursor: "not-allowed",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  color: "rgba(140,180,220,0.8)",
  marginBottom: "6px",
  display: "block",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

export default function AddReportPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [naFlags, setNaFlags] = useState<Record<string, boolean>>({});
  const [crewNames, setCrewNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/positions")
      .then((r) => r.json())
      .then(setPositions)
      .catch(() => {});
  }, []);

  const selectedPosition = positions.find((p) => p.id === selectedPositionId) ?? null;
  const crewPositions = positions.filter((p) => p.id !== selectedPositionId);

  function handlePositionChange(id: number) {
    setSelectedPositionId(id);
    setNaFlags({});
    setCrewNames({});
  }

  function toggleNa(posName: string) {
    setNaFlags((prev) => {
      const next = { ...prev, [posName]: !prev[posName] };
      if (next[posName]) {
        setCrewNames((c) => ({ ...c, [posName]: "" }));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Validate crew fields
    for (const pos of crewPositions) {
      const isNa = naFlags[pos.name];
      const name = crewNames[pos.name]?.trim();
      const isReferee = pos.name === "Referee";
      if (!isNa && !name) {
        setError(`Please enter a name for ${pos.name}, or mark it N/A.`);
        return;
      }
      if (isReferee && isNa) {
        setError("The Referee field cannot be marked N/A.");
        return;
      }
    }

    setSubmitting(true);

    const form = e.currentTarget;
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value ?? "";

    // Build crew payload — null when user holds that position, "N/A" or name otherwise
    const crewPayload: Record<string, string | null> = {};
    for (const pos of positions) {
      const field = CREW_FIELD[pos.name];
      if (pos.id === selectedPositionId) {
        crewPayload[field] = null;
      } else {
        crewPayload[field] = naFlags[pos.name] ? "N/A" : (crewNames[pos.name]?.trim() ?? "N/A");
      }
    }

    const payload = {
      matchDate: get("matchDate"),
      matchTime: get("matchTime"),
      location: get("location"),
      homeTeam: get("homeTeam"),
      awayTeam: get("awayTeam"),
      league: get("league"),
      ageGroup: get("ageGroup"),
      positionId: selectedPositionId,
      ...crewPayload,
    };

    try {
      const res = await fetch("/api/match-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
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
    <div
      className="p-6 lg:p-10 max-w-3xl"
      style={{ backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}
    >
      <div className="mb-8">
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
          Add Match Report
        </h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
          Record the details for a match you officiated.
        </p>
      </div>

      <div style={{
        background: "rgba(0,20,50,0.6)",
        border: "1px solid rgba(0,150,255,0.14)",
        borderRadius: "12px",
        padding: "28px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent)" }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Match Date">
              <input type="date" name="matchDate" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
              />
            </Field>
            <Field label="Kick-off Time">
              <input type="time" name="matchTime" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
              />
            </Field>
          </div>

          {/* Location */}
          <Field label="Location / Venue">
            <input type="text" name="location" placeholder="e.g. Riverside Park Field 3" required style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
            />
          </Field>

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          {/* Home + Away */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Home Team">
              <input type="text" name="homeTeam" placeholder="Home team name" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
              />
            </Field>
            <Field label="Away Team">
              <input type="text" name="awayTeam" placeholder="Away team name" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
              />
            </Field>
          </div>

          {/* League + Age Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="League / Competition">
              <input type="text" name="league" placeholder="e.g. AYSO Region 10" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
              />
            </Field>
            <Field label="Age Group">
              <select name="ageGroup" required style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
              >
                <option value="" style={{ background: "#071428" }}>Select age group…</option>
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g} style={{ background: "#071428" }}>{g}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,150,255,0.1)" }} />

          {/* Your Position */}
          <Field label="Your Position">
            <select
              name="positionId"
              required
              value={selectedPositionId ?? ""}
              onChange={e => handlePositionChange(Number(e.target.value))}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,210,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(0,150,255,0.25)")}
            >
              <option value="" style={{ background: "#071428" }}>Select your position…</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id} style={{ background: "#071428" }}>{p.name}</option>
              ))}
            </select>
          </Field>

          {/* Crew section — revealed after position is selected */}
          {selectedPosition && crewPositions.length > 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "20px",
              background: "rgba(0,40,90,0.3)",
              border: "1px solid rgba(0,150,255,0.12)",
              borderRadius: "10px",
            }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", marginBottom: "4px" }}>
                OFFICIATING CREW
              </div>

              {crewPositions.map((pos) => {
                const isReferee = pos.name === "Referee";
                const isNa = naFlags[pos.name] ?? false;

                return (
                  <div key={pos.id}>
                    {/* Label row with N/A toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={labelStyle}>{pos.name.toUpperCase()}</span>
                      {!isReferee && (
                        <button
                          type="button"
                          onClick={() => toggleNa(pos.name)}
                          style={{
                            fontSize: "10px",
                            letterSpacing: "0.08em",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            border: `1px solid ${isNa ? "rgba(0,210,255,0.5)" : "rgba(0,150,255,0.2)"}`,
                            background: isNa ? "rgba(0,180,255,0.15)" : "transparent",
                            color: isNa ? "#00d2ff" : "rgba(120,170,220,0.5)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          N/A
                        </button>
                      )}
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      placeholder={isNa ? "Not applicable" : `${pos.name} name`}
                      disabled={isNa}
                      value={isNa ? "" : (crewNames[pos.name] ?? "")}
                      onChange={e => setCrewNames(prev => ({ ...prev, [pos.name]: e.target.value }))}
                      style={isNa ? disabledInputStyle : inputStyle}
                      onFocus={e => { if (!isNa) e.target.style.borderColor = "rgba(0,210,255,0.5)"; }}
                      onBlur={e => { if (!isNa) e.target.style.borderColor = "rgba(0,150,255,0.25)"; }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ff8080" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#60d890" }}>
              Report saved! Redirecting…
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "13px",
                borderRadius: "8px",
                background: submitting ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.06em",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 0 20px rgba(0,120,255,0.25)",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "SAVING…" : "SAVE REPORT"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "13px 20px",
                borderRadius: "8px",
                background: "transparent",
                color: "rgba(140,180,220,0.6)",
                fontSize: "14px",
                border: "1px solid rgba(0,150,255,0.2)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
