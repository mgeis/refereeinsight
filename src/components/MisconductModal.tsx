"use client";

import { useState, useEffect } from "react";

export const CAUTION_REASONS = [
  "Unsporting behavior",
  "Dissent by word or action",
  "Persistent infringement",
  "Delaying the restart of play",
  "Failure to respect the required distance",
  "Entering or re-entering the field without permission",
  "Deliberately leaving the field without permission",
];

export const SENDOFF_REASONS = [
  "Serious foul play",
  "Violent conduct",
  "Spitting at an opponent or any other person",
  "Denying a goal or obvious goal-scoring opportunity – handball",
  "Denying a goal or obvious goal-scoring opportunity – foul",
  "Using offensive, insulting or abusive language and/or gestures",
  "Receiving a second caution",
];

export type MisconductData = {
  type: "CAUTION" | "SENDOFF";
  recipientType: "PLAYER" | "TEAM_STAFF";
  minute: number;
  number: string;
  name: string;
  reason: string;
  description: string;
};

type Props = {
  isOpen: boolean;
  type: "CAUTION" | "SENDOFF";
  onClose: () => void;
  onSubmit: (data: MisconductData) => void;
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
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  color: "rgba(140,180,220,0.8)",
  marginBottom: "6px",
  display: "block",
};

export function MisconductModal({ isOpen, type, onClose, onSubmit }: Props) {
  const [recipientType, setRecipientType] = useState<"PLAYER" | "TEAM_STAFF">("PLAYER");
  const [minute, setMinute] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const reasons = type === "CAUTION" ? CAUTION_REASONS : SENDOFF_REASONS;
  const accentColor = type === "CAUTION" ? "#f5c400" : "#ff4d4d";
  const accentBorder = type === "CAUTION" ? "rgba(245,196,0,0.35)" : "rgba(255,77,77,0.35)";
  const accentBg = type === "CAUTION" ? "rgba(245,196,0,0.12)" : "rgba(255,77,77,0.12)";

  useEffect(() => {
    if (isOpen) {
      setRecipientType("PLAYER");
      setMinute("");
      setNumber("");
      setName("");
      setReason("");
      setDescription("");
    }
  }, [isOpen, type]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ type, recipientType, minute: Number(minute), number, name, reason, description });
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,5,20,0.88)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#060e1f", border: `1px solid ${accentBorder}`, borderRadius: "14px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, borderRadius: "14px 14px 0 0" }} />

        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "18px", height: "26px", borderRadius: "3px",
              background: accentColor, boxShadow: `0 0 14px ${accentColor}70`,
              flexShrink: 0,
            }} />
            <h2 style={{ color: "#e8f4ff", fontSize: "16px", fontWeight: 700, letterSpacing: "0.06em", margin: 0 }}>
              {type === "CAUTION" ? "CAUTION" : "SEND-OFF"}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(120,170,220,0.5)", cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "4px 8px" }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Recipient type toggle */}
          <div>
            <label style={labelStyle}>RECIPIENT TYPE</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["PLAYER", "TEAM_STAFF"] as const).map(rt => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setRecipientType(rt)}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: "8px", cursor: "pointer",
                    fontSize: "12px", letterSpacing: "0.07em", fontWeight: 600,
                    border: `1px solid ${recipientType === rt ? accentBorder : "rgba(0,150,255,0.2)"}`,
                    background: recipientType === rt ? accentBg : "transparent",
                    color: recipientType === rt ? accentColor : "rgba(120,170,220,0.5)",
                    transition: "all 0.15s",
                  }}
                >
                  {rt === "PLAYER" ? "Player" : "Team Staff"}
                </button>
              ))}
            </div>
          </div>

          {/* Minute + Number */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>MINUTE</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 45"
                value={minute}
                onChange={e => setMinute(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>NUMBER (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. 10"
                value={number}
                onChange={e => setNumber(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>NAME</label>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Reason */}
          <div>
            <label style={labelStyle}>REASON</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="" style={{ background: "#071428" }}>Select reason…</option>
              {reasons.map(r => <option key={r} value={r} style={{ background: "#071428" }}>{r}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>DESCRIPTION (OPTIONAL)</label>
            <textarea
              placeholder="Additional details about the incident…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button
              type="submit"
              style={{
                flex: 1, padding: "12px", borderRadius: "8px",
                background: accentBg, border: `1px solid ${accentBorder}`,
                color: accentColor, fontWeight: 700, fontSize: "13px",
                letterSpacing: "0.07em", cursor: "pointer",
              }}
            >
              ADD {type === "CAUTION" ? "CAUTION" : "SEND-OFF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "12px 18px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(0,150,255,0.2)", color: "rgba(140,180,220,0.6)", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
