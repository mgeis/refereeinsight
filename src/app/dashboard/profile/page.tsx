"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";

type ApiToken = {
  id: number;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

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

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  color: "rgba(180,210,240,0.5)",
  cursor: "not-allowed",
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

function Banner({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const isError = kind === "error";
  return (
    <div style={{
      background: isError ? "rgba(255,60,60,0.1)" : "rgba(0,200,100,0.1)",
      border: `1px solid ${isError ? "rgba(255,80,80,0.3)" : "rgba(0,200,100,0.3)"}`,
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      color: isError ? "#ff8080" : "#60d890",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      {!isError && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3 3 6-6" stroke="#60d890" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {children}
    </div>
  );
}

function SubmitButton({ saving, label, savingLabel }: { saving: boolean; label: string; savingLabel: string }) {
  return (
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
      {saving ? savingLabel : label}
    </button>
  );
}

export default function ProfilePage() {
  const [loading, setLoading]     = useState(true);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [pictureError, setPictureError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [ussfId,    setUssfId]    = useState("");
  const [aysoId,    setAysoId]    = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError]   = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName  ?? "");
        setUsername(data.username  ?? "");
        setEmail(data.email        ?? "");
        setPhone(data.phone        ?? "");
        setUssfId(data.ussfId      ?? "");
        setAysoId(data.aysoId      ?? "");
        setProfilePictureUrl(data.profilePictureUrl ?? null);
        setLoading(false);
      })
      .catch(() => { setProfileError("Failed to load profile."); setLoading(false); });

    fetchApiTokens();
  }, []);

  function fetchApiTokens() {
    fetch("/api/profile/api-tokens")
      .then(r => r.json())
      .then(setApiTokens)
      .catch(() => {});
  }

  function refreshProfilePicture() {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => setProfilePictureUrl(data.profilePictureUrl ?? null))
      .catch(() => {});
  }

  async function handlePictureSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPictureError("");
    setPictureUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile/picture", { method: "POST", body });
      const data = await res.json();
      if (res.ok) {
        refreshProfilePicture();
      } else {
        setPictureError(data.error ?? "Failed to upload picture.");
      }
    } catch {
      setPictureError("Unable to connect. Please try again.");
    } finally {
      setPictureUploading(false);
    }
  }

  async function handleRemovePicture() {
    setPictureError("");
    setPictureUploading(true);
    try {
      await fetch("/api/profile/picture", { method: "DELETE" });
      setProfilePictureUrl(null);
    } catch {
      setPictureError("Unable to connect. Please try again.");
    } finally {
      setPictureUploading(false);
    }
  }

  async function handleGenerateToken(e: React.FormEvent) {
    e.preventDefault();
    setTokenError("");
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/profile/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newTokenLabel || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewlyCreatedToken(data.token);
        setNewTokenLabel("");
        fetchApiTokens();
      } else {
        setTokenError(data.error ?? "Failed to generate token.");
      }
    } catch {
      setTokenError("Unable to connect. Please try again.");
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleRevokeToken(id: number) {
    await fetch(`/api/profile/api-tokens/${id}`, { method: "DELETE" });
    fetchApiTokens();
  }

  function handleCopyToken() {
    if (!newlyCreatedToken) return;
    navigator.clipboard.writeText(newlyCreatedToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, username, ussfId, aysoId }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 4000);
      } else {
        setProfileError(data.error ?? "Failed to save changes.");
      }
    } catch {
      setProfileError("Unable to connect. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPass !== confirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPass.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword("");
        setNewPass("");
        setConfirm("");
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 4000);
      } else {
        setPasswordError(data.error ?? "Failed to change password.");
      }
    } catch {
      setPasswordError("Unable to connect. Please try again.");
    } finally {
      setPasswordSaving(false);
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

      {/* Profile picture */}
      <SectionCard title="PROFILE PICTURE" subtitle="JPEG, PNG, or WEBP, up to 5MB.">
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            background: "rgba(0,60,120,0.4)", border: "1px solid rgba(0,150,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePictureUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "24px", color: "rgba(140,180,220,0.5)" }}>
                {(firstName[0] ?? "") + (lastName[0] ?? "")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{
              padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
              cursor: pictureUploading ? "not-allowed" : "pointer", border: "1px solid rgba(0,150,255,0.3)",
              background: "rgba(0,100,200,0.15)", color: "#00d2ff", width: "fit-content",
              opacity: pictureUploading ? 0.6 : 1,
            }}>
              {pictureUploading ? "UPLOADING…" : "UPLOAD PHOTO"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePictureSelected}
                disabled={pictureUploading}
                style={{ display: "none" }}
              />
            </label>
            {profilePictureUrl && (
              <button
                type="button"
                onClick={handleRemovePicture}
                disabled={pictureUploading}
                style={{
                  fontSize: "12px", color: "rgba(255,120,120,0.8)", background: "none", border: "none",
                  cursor: pictureUploading ? "not-allowed" : "pointer", padding: 0, textAlign: "left",
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        {pictureError && <Banner kind="error">{pictureError}</Banner>}
      </SectionCard>

      {/* Personal info + account form */}
      <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column" }}>
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
            <Field label="Email" hint="Contact support to change your email.">
              <input type="email" value={email} disabled style={disabledInputStyle} />
            </Field>
            <Field label="Phone" hint="Contact support to change your phone number.">
              <input type="tel" value={phone || "—"} disabled style={disabledInputStyle} />
            </Field>
          </div>
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
          <Link href="/dashboard/eula" style={{ fontSize: "12px", color: "rgba(0,180,255,0.7)", textDecoration: "none" }}>
            View End User License Agreement →
          </Link>
        </SectionCard>

        {profileError && <Banner kind="error">{profileError}</Banner>}
        {profileSuccess && <Banner kind="success">Profile updated successfully.</Banner>}

        <SubmitButton saving={profileSaving} label="SAVE CHANGES" savingLabel="SAVING…" />
      </form>

      {/* Password change — separate form, requires current password */}
      <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", marginTop: "28px" }}>
        <SectionCard
          title="CHANGE PASSWORD"
          subtitle="Requires your current password."
        >
          <Field label="Current Password">
            <PasswordInput
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New Password">
              <PasswordInput
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
                autoComplete="new-password"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>
            <Field label="Confirm New Password">
              <PasswordInput
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
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

        {passwordError && <Banner kind="error">{passwordError}</Banner>}
        {passwordSuccess && <Banner kind="success">Password changed successfully.</Banner>}

        <SubmitButton saving={passwordSaving} label="CHANGE PASSWORD" savingLabel="CHANGING…" />
      </form>

      {/* MCP access tokens */}
      <div style={{ marginTop: "28px" }}>
        <SectionCard
          title="MCP ACCESS TOKENS"
          subtitle="Personal tokens for connecting an MCP client (e.g. Claude) or the external REST API to your own match report data."
        >
          {newlyCreatedToken && (
            <div style={{
              background: "rgba(0,150,255,0.08)", border: "1px solid rgba(0,150,255,0.3)",
              borderRadius: "8px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px",
            }}>
              <div style={{ fontSize: "12px", color: "#00d2ff", fontWeight: 600 }}>
                Copy this token now — it won&apos;t be shown again.
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <code style={{
                  flex: 1, fontSize: "12px", color: "#e8f4ff", background: "rgba(0,10,30,0.6)",
                  padding: "8px 10px", borderRadius: "6px", overflowX: "auto", whiteSpace: "nowrap",
                }}>
                  {newlyCreatedToken}
                </code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  style={{
                    padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                    cursor: "pointer", border: "1px solid rgba(0,150,255,0.3)",
                    background: "rgba(0,100,200,0.15)", color: "#00d2ff", flexShrink: 0,
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewlyCreatedToken(null)}
                style={{ alignSelf: "flex-start", background: "none", border: "none", color: "rgba(140,180,220,0.6)", fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                Done
              </button>
            </div>
          )}

          <form onSubmit={handleGenerateToken} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Field label="Label" hint="Optional — e.g. &quot;Claude Desktop&quot;.">
                <input
                  type="text"
                  value={newTokenLabel}
                  onChange={e => setNewTokenLabel(e.target.value)}
                  placeholder="e.g. Claude Desktop"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={generatingToken}
              style={{
                padding: "11px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                letterSpacing: "0.04em", cursor: generatingToken ? "not-allowed" : "pointer", border: "none",
                background: generatingToken ? "rgba(0,80,160,0.5)" : "linear-gradient(135deg, #0055cc, #0099ee)",
                color: "#fff", opacity: generatingToken ? 0.7 : 1, flexShrink: 0,
              }}
            >
              {generatingToken ? "GENERATING…" : "GENERATE TOKEN"}
            </button>
          </form>

          {tokenError && <Banner kind="error">{tokenError}</Banner>}

          {apiTokens.length === 0 ? (
            <p style={{ fontSize: "13px", color: "rgba(120,160,200,0.4)", fontStyle: "italic", margin: 0 }}>
              No tokens yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {apiTokens.map(t => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                  padding: "10px 14px", borderRadius: "8px",
                  background: "rgba(0,10,30,0.4)", border: "1px solid rgba(0,100,200,0.15)",
                  opacity: t.revokedAt ? 0.5 : 1,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "13px", color: "#e8f4ff", fontWeight: 500 }}>
                      {t.label || "Unnamed token"}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(100,150,200,0.6)" }}>
                      Created {formatDateTime(t.createdAt)}
                      {t.lastUsedAt && ` · Last used ${formatDateTime(t.lastUsedAt)}`}
                      {t.revokedAt && ` · Revoked ${formatDateTime(t.revokedAt)}`}
                    </span>
                  </div>
                  {!t.revokedAt && (
                    <button
                      type="button"
                      onClick={() => handleRevokeToken(t.id)}
                      style={{
                        fontSize: "11px", padding: "5px 12px", borderRadius: "5px", flexShrink: 0,
                        background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,80,80,0.2)",
                        color: "#ff8080", cursor: "pointer",
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
