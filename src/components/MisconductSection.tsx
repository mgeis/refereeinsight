"use client";

import { useState } from "react";
import { MisconductModal, MisconductData } from "./MisconductModal";

export type MisconductRecord = {
  id: number;
  type: "CAUTION" | "SENDOFF";
  recipientType: "PLAYER" | "TEAM_STAFF";
  minute: number;
  number: string | null;
  name: string;
  reason: string;
  description: string | null;
};

type Props = {
  matchReportId: number;
  initialMisconducts: MisconductRecord[];
};

function CardBadge({ type }: { type: "CAUTION" | "SENDOFF" }) {
  const isCaution = type === "CAUTION";
  return (
    <div style={{
      width: "14px", height: "20px", borderRadius: "2px", flexShrink: 0,
      background: isCaution ? "#f5c400" : "#ff4d4d",
      boxShadow: isCaution ? "0 0 8px rgba(245,196,0,0.5)" : "0 0 8px rgba(255,77,77,0.5)",
    }} />
  );
}

function MisconductRow({ m, onDelete }: { m: MisconductRecord; onDelete: () => void }) {
  const isCaution = m.type === "CAUTION";
  const accentColor = isCaution ? "#f5c400" : "#ff4d4d";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      padding: "12px 14px", borderRadius: "8px",
      background: isCaution ? "rgba(245,196,0,0.05)" : "rgba(255,77,77,0.05)",
      border: `1px solid ${isCaution ? "rgba(245,196,0,0.15)" : "rgba(255,77,77,0.15)"}`,
    }}>
      <CardBadge type={m.type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#e8f4ff" }}>{m.name}</span>
          {m.number && <span style={{ fontSize: "12px", color: "rgba(140,180,220,0.5)" }}>#{m.number}</span>}
          <span style={{ fontSize: "11px", color: "rgba(140,180,220,0.4)", letterSpacing: "0.06em" }}>
            {m.recipientType === "PLAYER" ? "Player" : "Team Staff"}
          </span>
          <span style={{ fontSize: "12px", color: accentColor, marginLeft: "auto" }}>{m.minute}&apos;</span>
        </div>
        <div style={{ fontSize: "12px", color: "rgba(140,180,220,0.6)", marginTop: "3px" }}>{m.reason}</div>
        {m.description && <div style={{ fontSize: "12px", color: "rgba(120,160,200,0.5)", marginTop: "4px", fontStyle: "italic" }}>{m.description}</div>}
      </div>
      <button
        onClick={onDelete}
        title="Remove"
        style={{ background: "transparent", border: "none", color: "rgba(120,160,200,0.35)", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

export function MisconductSection({ matchReportId, initialMisconducts }: Props) {
  const [misconducts, setMisconducts] = useState<MisconductRecord[]>(
    [...initialMisconducts].sort((a, b) => a.minute - b.minute)
  );
  const [modalType, setModalType] = useState<"CAUTION" | "SENDOFF" | null>(null);
  const [error, setError] = useState("");

  async function handleAdd(data: MisconductData) {
    setError("");
    try {
      const res = await fetch(`/api/match-reports/${matchReportId}/misconducts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: MisconductRecord = await res.json();
        setMisconducts(prev => [...prev, created].sort((a, b) => a.minute - b.minute));
        setModalType(null);
      } else {
        setError("Failed to save misconduct.");
      }
    } catch {
      setError("Unable to connect.");
    }
  }

  async function handleDelete(id: number) {
    setError("");
    try {
      const res = await fetch(`/api/match-reports/${matchReportId}/misconducts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMisconducts(prev => prev.filter(m => m.id !== id));
      } else {
        setError("Failed to delete misconduct.");
      }
    } catch {
      setError("Unable to connect.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", marginBottom: misconducts.length > 0 ? "14px" : "0" }}>
        <button
          type="button"
          onClick={() => setModalType("CAUTION")}
          style={{
            padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
            fontSize: "12px", fontWeight: 700, letterSpacing: "0.07em",
            background: "rgba(245,196,0,0.1)", border: "1px solid rgba(245,196,0,0.3)",
            color: "#f5c400",
          }}
        >
          + CAUTION
        </button>
        <button
          type="button"
          onClick={() => setModalType("SENDOFF")}
          style={{
            padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
            fontSize: "12px", fontWeight: 700, letterSpacing: "0.07em",
            background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)",
            color: "#ff4d4d",
          }}
        >
          + SEND-OFF
        </button>
      </div>

      {misconducts.length === 0 ? (
        <p style={{ fontSize: "13px", color: "rgba(120,160,200,0.4)", fontStyle: "italic", margin: "10px 0 0" }}>
          No cards issued
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {misconducts.map(m => (
            <MisconductRow key={m.id} m={m} onDelete={() => handleDelete(m.id)} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: "10px", fontSize: "13px", color: "#ff8080", background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: "6px", padding: "8px 12px" }}>
          {error}
        </div>
      )}

      {modalType && (
        <MisconductModal
          isOpen={true}
          type={modalType}
          onClose={() => setModalType(null)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
