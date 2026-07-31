"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  padding: "13px 20px",
  borderRadius: "8px",
  background: loading ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)",
  color: "#fff",
  fontWeight: 600,
  fontSize: "14px",
  letterSpacing: "0.06em",
  border: "none",
  cursor: loading ? "not-allowed" : "pointer",
  boxShadow: loading ? "none" : "0 0 24px rgba(0,120,255,0.3)",
  opacity: loading ? 0.7 : 1,
});

export function AcceptEulaForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/eula/accept", { method: "POST" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to record acceptance. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "rgba(200,225,255,0.8)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ marginTop: "2px", cursor: "pointer", accentColor: "#00d2ff" }}
        />
        I have read and agree to the End User License Agreement.
      </label>

      {error && (
        <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ff8080" }}>
          {error}
        </div>
      )}

      <button onClick={handleAccept} disabled={!agreed || loading} style={submitButtonStyle(!agreed || loading)}>
        {loading ? "SAVING…" : "I AGREE — CONTINUE"}
      </button>
    </div>
  );
}
