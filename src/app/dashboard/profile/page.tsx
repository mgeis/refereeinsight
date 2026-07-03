"use client";

import { useEffect, useState } from "react";

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
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  color: "rgba(140,180,220,0.8)",
  marginBottom: "6px",
  display: "block",
};

const hintStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(100,150,200,0.45)",
  marginTop: "5px",
};

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>{label.toUpperCase()}</label>
      {children}
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

function onFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(0,210,255,0.5)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(0,150,255,0.25)";
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(0,20,50,0.6)",
      border: "1px solid rgba(0,150,255,0.14)",
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "16px",
    }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(0,100,200,0.12)" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", fontWeight: 600 }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: "12px", color: "rgba(100,150,200,0.45)", marginTop: "3px" }}>{subtitle}</div>}
      </div>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [ussfId,    setUssfId]    = useState("");
  const [aysoId,    setAysoId]    = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName  ?? "");
        setUsername(data.username  ?? "");
        setUssfId(data.ussfId      ?? "");
        setAysoId(data.aysoId      ?? "");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load profile."); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPass || confirm) {
      if (newPass !== confirm) {
        setError("New password and confirmation do not match.");
        return;
      }
      if (newPass.length < 4) {
        setError("Password must be at least 4 characters.");
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, username, ussfId, aysoId, newPassword: newPass || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewPass("");
        setConfirm("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(data.error ?? "Failed to save changes.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-10" style={{ color: "rgba(120,170,220,0.6)", fontSize: "14px" }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div
      className="p-6 lg:p-10"
      style={{
        maxWidth: "640px",
        backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
          Profile
        </h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
          Manage your personal details and account settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0" }}>

        {/* Personal info */}
        <SectionCard title="PERSONAL INFORMATION">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
            <Field label="Last Name">
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard
          title="ACCOUNT"
          subtitle="Your login credentials and referee organization IDs."
        >
          <Field label="Username" hint="Used to log in to Referee Insight.">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="USSF ID" hint="Optional — your US Soccer Federation ID.">
              <input
                type="text"
                value={ussfId}
                onChange={e => setUssfId(e.target.value)}
                placeholder="e.g. 123456789"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
            <Field label="AYSO ID" hint="Optional — your AYSO member ID.">
              <input
                type="text"
                value={aysoId}
                onChange={e => setAysoId(e.target.value)}
                placeholder="e.g. 987654321"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Password */}
        <SectionCard
          title="CHANGE PASSWORD"
          subtitle="Leave both fields empty to keep your current password."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New Password">
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: confirm && newPass && confirm !== newPass
                    ? "rgba(255,80,80,0.5)"
                    : "rgba(0,150,255,0.25)",
                }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Feedback */}
        {error && (
          <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ff8080", marginBottom: "16px" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(0,200,100,0.1)", border: "1px solid rgba(0,200,100,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#60d890", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3 3 6-6" stroke="#60d890" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Profile updated successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "13px",
            borderRadius: "8px",
            background: saving ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "0.06em",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 0 20px rgba(0,120,255,0.25)",
            opacity: saving ? 0.7 : 1,
            transition: "all 0.15s",
          }}
        >
          {saving ? "SAVING…" : "SAVE CHANGES"}
        </button>
      </form>
    </div>
  );
}
