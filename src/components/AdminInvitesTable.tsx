"use client";

import { useState } from "react";
import { MatchReportsTable, ReportColumn, BaseReport } from "@/components/MatchReportsTable";

type Invite = BaseReport & {
  email: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  invitedBy: { firstName: string; lastName: string };
  status: "pending" | "expired" | "used";
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLE: Record<Invite["status"], { label: string; color: string }> = {
  pending: { label: "Pending", color: "#00d2ff" },
  used:    { label: "Used",    color: "#5fd98a" },
  expired: { label: "Expired", color: "#ff8080" },
};

const COLUMNS: ReportColumn<Invite>[] = [
  { key: "email", label: "Email", filterParam: "email", render: i => i.email },
  { key: "invitedBy", label: "Invited By", render: i => `${i.invitedBy.firstName} ${i.invitedBy.lastName}` },
  { key: "createdAt", label: "Sent", cellStyle: { color: "rgba(160,195,235,0.7)" }, render: i => formatDate(i.createdAt) },
  { key: "expiresAt", label: "Expires", cellStyle: { color: "rgba(160,195,235,0.7)" }, render: i => formatDate(i.expiresAt) },
  {
    key: "status", label: "Status",
    render: i => <span style={{ color: STATUS_STYLE[i.status].color, fontWeight: 600 }}>{STATUS_STYLE[i.status].label}</span>,
  },
];

const inputStyle: React.CSSProperties = {
  background: "rgba(0,30,60,0.6)",
  border: "1px solid rgba(0,150,255,0.25)",
  borderRadius: "8px",
  padding: "11px 14px",
  color: "#e8f4ff",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export function AdminInvitesTable() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSending(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Invite sent to ${data.email}.`);
        setEmail("");
        setRefreshKey(k => k + 1);
      } else {
        setError(data.error ?? "Failed to send invite.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* MatchReportsTable below supplies its own full-page padding/background —
          this card sits just above it, so only horizontal + top padding here. */}
      <div className="px-6 pt-6 lg:px-10 lg:pt-10">
        <div style={{
          background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px",
          padding: "20px 24px",
        }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", fontWeight: 600, marginBottom: "12px" }}>
          SEND INVITE
        </div>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="person@example.com"
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            style={{
              padding: "11px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.05em",
              cursor: sending ? "not-allowed" : "pointer", border: "none",
              background: sending ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)",
              color: "#fff", opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? "SENDING…" : "SEND INVITE"}
          </button>
        </form>
        {error && <div style={{ marginTop: "10px", fontSize: "13px", color: "#ff8080" }}>{error}</div>}
        {success && <div style={{ marginTop: "10px", fontSize: "13px", color: "#60d890" }}>{success}</div>}
          <p style={{ marginTop: "10px", fontSize: "11px", color: "rgba(120,170,220,0.5)" }}>
            Invite codes expire after one week, work only for this email address, and can only be used once.
          </p>
        </div>
      </div>

      <MatchReportsTable<Invite>
        key={refreshKey}
        apiUrl="/api/admin/invites"
        dataKey="invites"
        columns={COLUMNS}
        title="Invites"
        emptyLabel="No invites sent yet."
        subtitle={total => total > 0 ? `${total} invite${total !== 1 ? "s" : ""} sent` : "No invites sent yet"}
      />
    </div>
  );
}
