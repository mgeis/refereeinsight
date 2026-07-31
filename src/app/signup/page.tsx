"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EulaViewer } from "@/components/EulaViewer";
import { PasswordInput } from "@/components/PasswordInput";

const inputStyle: React.CSSProperties = {
  background: "rgba(0,30,60,0.6)",
  border: "1px solid rgba(0,150,255,0.25)",
  borderRadius: "8px",
  padding: "12px 16px",
  color: "#e8f4ff",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "rgba(140,180,220,0.8)",
};

const hintStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(100,150,200,0.45)",
  marginTop: "4px",
};

const errorBannerStyle: React.CSSProperties = {
  background: "rgba(255,60,60,0.1)",
  border: "1px solid rgba(255,80,80,0.3)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#ff8080",
};

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  marginTop: "8px",
  padding: "13px",
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={labelStyle}>{label.toUpperCase()}</label>
      {children}
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "confirm">("form");
  const [username, setUsername] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ussfId, setUssfId] = useState("");
  const [aysoId, setAysoId] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [code, setCode] = useState("");

  const [eulaAccepted, setEulaAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Convenience prefill for the "Create your account" link in the invite email.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const invitedEmail = params.get("email");
    if (invite) setInviteCode(invite);
    if (invitedEmail) setEmail(invitedEmail);
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!eulaAccepted) {
      setError("You must agree to the End User License Agreement to create an account.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, username, password, email, inviteCode,
          phone: phone || undefined,
          ussfId: ussfId || undefined,
          aysoId: aysoId || undefined,
          eulaAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign up failed.");
        return;
      }
      if (data.needsConfirmation) {
        setStep("confirm");
      } else {
        router.push("/");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        setError(data.error ?? "Failed to confirm account.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-8 py-16" style={{ background: "#050d1a" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
            <defs>
              <radialGradient id="logoBall2" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#0a2a4a" />
                <stop offset="100%" stopColor="#010a18" />
              </radialGradient>
              <linearGradient id="logoRing2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#0044bb" />
              </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="21" stroke="url(#logoRing2)" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="15" fill="url(#logoBall2)" />
            <circle cx="22" cy="22" r="15" fill="none" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
          </svg>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.04em", color: "#e8f4ff", lineHeight: 1.1 }}>
              REFEREE
            </div>
            <div style={{ fontSize: "10px", letterSpacing: "0.22em", color: "#00d2ff", fontWeight: 500 }}>
              INSIGHT
            </div>
          </div>
        </div>

        {step === "form" ? (
          <>
            <h1 style={{ color: "#e8f4ff", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>
              Create your account
            </h1>
            <p style={{ color: "rgba(140,180,220,0.7)", fontSize: "14px", marginBottom: "28px" }}>
              Start tracking your match reports and referee development.
            </p>

            <form className="flex flex-col gap-5" onSubmit={handleSignup}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
                </Field>
                <Field label="Last Name">
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
                </Field>
              </div>

              <Field label="Username" hint="What you'll use to sign in.">
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" style={inputStyle} />
              </Field>

              <Field label="Email" hint="Used for account verification and password resets.">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
              </Field>

              <Field label="Invite Code" hint="From the invite email an admin sent you — tied to the email above.">
                <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required placeholder="inv_xxxxxxxxxxxxxxxx" style={inputStyle} />
              </Field>

              <Field label="Phone (optional)" hint="E.164 format, e.g. +15551234567.">
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+15551234567" style={inputStyle} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Password">
                  <PasswordInput value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" style={inputStyle} />
                </Field>
                <Field label="Confirm Password">
                  <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" style={inputStyle} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="USSF ID (optional)">
                  <input type="text" value={ussfId} onChange={e => setUssfId(e.target.value)} placeholder="e.g. 123456789" style={inputStyle} />
                </Field>
                <Field label="AYSO ID (optional)">
                  <input type="text" value={aysoId} onChange={e => setAysoId(e.target.value)} placeholder="e.g. 987654321" style={inputStyle} />
                </Field>
              </div>

              <Field label="End User License Agreement">
                <EulaViewer />
              </Field>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "rgba(200,225,255,0.8)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={eulaAccepted}
                  onChange={e => setEulaAccepted(e.target.checked)}
                  required
                  style={{ marginTop: "2px", cursor: "pointer", accentColor: "#00d2ff" }}
                />
                I have read and agree to the End User License Agreement.
              </label>

              {error && <div style={errorBannerStyle}>{error}</div>}

              <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
                {loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ color: "#e8f4ff", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>
              Verify your account
            </h1>
            <p style={{ color: "rgba(140,180,220,0.7)", fontSize: "14px", marginBottom: "28px" }}>
              We sent a verification code to {email || "your email"}. Enter it below to finish setting up your account.
            </p>

            <form className="flex flex-col gap-5" onSubmit={handleConfirm}>
              <Field label="Verification Code">
                <input type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="Code from your email" style={inputStyle} />
              </Field>

              {error && <div style={errorBannerStyle}>{error}</div>}

              <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
                {loading ? "VERIFYING…" : "VERIFY & CONTINUE"}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: "28px", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "rgba(140,180,220,0.6)" }}>Already have an account? </span>
          <Link href="/" style={{ fontSize: "13px", color: "#00d2ff", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
