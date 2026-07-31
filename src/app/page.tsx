"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";

const fieldInputStyle: React.CSSProperties = {
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

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "rgba(140,180,220,0.8)",
};

const errorBannerStyle: React.CSSProperties = {
  background: "rgba(255,60,60,0.1)",
  border: "1px solid rgba(255,80,80,0.3)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#ff8080",
};

const successBannerStyle: React.CSSProperties = {
  background: "rgba(0,200,100,0.1)",
  border: "1px solid rgba(0,200,100,0.3)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#60d890",
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

const linkButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(0,180,255,0.7)",
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
  textAlign: "left",
};

type Mode = "login" | "forgot-request" | "forgot-confirm";

function ForgotPasswordFlow({ onDone }: { onDone: (message: string) => void }) {
  const [mode, setMode] = useState<Mode>("forgot-request");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setInfo(data.message ?? "If that account exists, a reset code has been sent.");
      setMode("forgot-confirm");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        onDone("Password reset. Sign in with your new password.");
      } else {
        setError(data.error ?? "Failed to reset password.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot-request") {
    return (
      <form className="flex flex-col gap-5" onSubmit={handleRequest}>
        <p style={{ fontSize: "13px", color: "rgba(140,180,220,0.7)" }}>
          Enter your username and we&apos;ll email a reset code to the address on file.
        </p>
        <div className="flex flex-col gap-1.5">
          <label style={fieldLabelStyle}>USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={fieldInputStyle}
          />
        </div>
        {error && <div style={errorBannerStyle}>{error}</div>}
        <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
          {loading ? "SENDING…" : "SEND RESET CODE"}
        </button>
        <button type="button" style={linkButtonStyle} onClick={() => onDone("")}>
          ← Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleConfirm}>
      {info && <div style={successBannerStyle}>{info}</div>}
      <div className="flex flex-col gap-1.5">
        <label style={fieldLabelStyle}>RESET CODE</label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          placeholder="Code from your email"
          style={fieldInputStyle}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label style={fieldLabelStyle}>NEW PASSWORD</label>
        <PasswordInput
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
          style={fieldInputStyle}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label style={fieldLabelStyle}>CONFIRM NEW PASSWORD</label>
        <PasswordInput
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          style={fieldInputStyle}
        />
      </div>
      {error && <div style={errorBannerStyle}>{error}</div>}
      <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
        {loading ? "RESETTING…" : "RESET PASSWORD"}
      </button>
      <button type="button" style={linkButtonStyle} onClick={() => onDone("")}>
        ← Back to sign in
      </button>
    </form>
  );
}

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [notice, setNotice] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error ?? "Login failed.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex" style={{ background: "#050d1a" }}>
      {/* Left panel — futuristic soccer graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center">
        {/* Grid background */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,210,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />

        {/* Radial glow */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,120,255,0.18) 0%, transparent 70%)",
        }} />

        {/* Hex ring decorations */}
        <svg className="absolute top-8 left-8 opacity-20" width="120" height="140" viewBox="0 0 120 140">
          <polygon points="60,5 115,35 115,95 60,125 5,95 5,35" fill="none" stroke="#00d2ff" strokeWidth="1.5" />
          <polygon points="60,20 100,42 100,88 60,110 20,88 20,42" fill="none" stroke="#00d2ff" strokeWidth="0.8" />
        </svg>
        <svg className="absolute bottom-12 right-10 opacity-20" width="80" height="92" viewBox="0 0 80 92">
          <polygon points="40,4 76,24 76,64 40,84 4,64 4,24" fill="none" stroke="#00d2ff" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-1/3 right-8 opacity-10" width="160" height="184" viewBox="0 0 160 184">
          <polygon points="80,6 154,46 154,126 80,166 6,126 6,46" fill="none" stroke="#00d2ff" strokeWidth="1" />
        </svg>

        {/* Corner brackets */}
        <div className="absolute opacity-30" style={{
          borderBottom: "1px solid #00d2ff",
          borderLeft: "1px solid #00d2ff",
          top: "24px",
          right: "24px",
          width: "48px",
          height: "48px",
        }} />
        <div className="absolute opacity-30" style={{
          borderTop: "1px solid #00d2ff",
          borderRight: "1px solid #00d2ff",
          bottom: "24px",
          left: "24px",
          width: "48px",
          height: "48px",
        }} />

        {/* Main soccer ball + data */}
        <div className="relative z-10 flex flex-col items-center gap-10">
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
            <defs>
              <radialGradient id="ballGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#0a2a4a" />
                <stop offset="100%" stopColor="#020d1c" />
              </radialGradient>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#0066ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Outer glow rings */}
            <circle cx="110" cy="110" r="108" stroke="rgba(0,210,255,0.08)" strokeWidth="1" />
            <circle cx="110" cy="110" r="96" stroke="rgba(0,210,255,0.14)" strokeWidth="1" />
            {/* Ball base */}
            <circle cx="110" cy="110" r="84" fill="url(#ballGrad)" />
            {/* Pentagon patches */}
            <polygon points="110,34 124,52 118,70 102,70 96,52" fill="rgba(0,20,50,0.85)" />
            <polygon points="168,68 178,88 164,102 148,96 148,76" fill="rgba(0,20,50,0.85)" />
            <polygon points="52,68 42,88 56,102 72,96 72,76" fill="rgba(0,20,50,0.85)" />
            <polygon points="168,152 162,170 146,174 136,160 148,146" fill="rgba(0,20,50,0.85)" />
            <polygon points="52,152 58,170 74,174 84,160 72,146" fill="rgba(0,20,50,0.85)" />
            <polygon points="110,186 96,170 102,154 118,154 124,170" fill="rgba(0,20,50,0.85)" />
            {/* Seam lines */}
            <line x1="110" y1="70" x2="110" y2="34" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="118" y1="70" x2="148" y2="76" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="102" y1="70" x2="72" y2="76" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="148" y1="96" x2="136" y2="114" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="72" y1="96" x2="84" y2="114" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="136" y1="130" x2="124" y2="154" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="84" y1="130" x2="96" y2="154" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            <line x1="124" y1="154" x2="96" y2="154" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            {/* Accent ring */}
            <circle cx="110" cy="110" r="84" fill="none" stroke="url(#ringGrad)" strokeWidth="2" />
            {/* Glare */}
            <ellipse cx="86" cy="76" rx="22" ry="14" fill="rgba(255,255,255,0.06)" transform="rotate(-20 86 76)" />
          </svg>

          {/* Analytics bars */}
          <div className="flex flex-col gap-3 w-64">
            {[
              { label: "Match Analysis", pct: "87%" },
              { label: "Performance Score", pct: "92%" },
              { label: "Incident Reports", pct: "74%" },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: "rgba(160,210,255,0.7)", fontSize: "11px", letterSpacing: "0.08em" }}>
                    {label.toUpperCase()}
                  </span>
                  <span style={{ color: "#00d2ff", fontSize: "11px" }}>{pct}</span>
                </div>
                <div style={{ height: "3px", background: "rgba(0,210,255,0.12)", borderRadius: "2px" }}>
                  <div style={{
                    height: "100%",
                    width: pct,
                    background: "linear-gradient(90deg, #0066ff, #00d2ff)",
                    borderRadius: "2px",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-16 relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(0,60,120,0.15) 0%, transparent 70%)",
        }} />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <defs>
                <radialGradient id="logoBall" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#0a2a4a" />
                  <stop offset="100%" stopColor="#010a18" />
                </radialGradient>
                <linearGradient id="logoRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00d2ff" />
                  <stop offset="100%" stopColor="#0044bb" />
                </linearGradient>
              </defs>
              <circle cx="22" cy="22" r="21" stroke="url(#logoRing)" strokeWidth="1.5" />
              <circle cx="22" cy="22" r="15" fill="url(#logoBall)" />
              <polygon points="22,10 26,16 24,22 20,22 18,16" fill="rgba(0,20,50,0.9)" />
              <polygon points="33,17 35,23 31,27 27,25 27,19" fill="rgba(0,20,50,0.9)" />
              <polygon points="11,17 9,23 13,27 17,25 17,19" fill="rgba(0,20,50,0.9)" />
              <circle cx="22" cy="22" r="15" fill="none" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
            </svg>
            <div>
              <div style={{
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#e8f4ff",
                lineHeight: 1.1,
              }}>
                REFEREE
              </div>
              <div style={{
                fontSize: "11px",
                letterSpacing: "0.22em",
                color: "#00d2ff",
                fontWeight: 500,
              }}>
                INSIGHT
              </div>
            </div>
          </div>

          <h1 style={{ color: "#e8f4ff", fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>
            {mode === "login" ? "Sign in" : "Reset password"}
          </h1>
          <p style={{ color: "rgba(140,180,220,0.7)", fontSize: "14px", marginBottom: "32px" }}>
            {mode === "login" ? "Access your game reports and analytics" : "We'll help you get back in"}
          </p>

          {notice && mode === "login" && (
            <div style={{ ...successBannerStyle, marginBottom: "20px" }}>{notice}</div>
          )}

          {mode === "login" ? (
            <>
              <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                <div className="flex flex-col gap-1.5">
                  <label style={fieldLabelStyle}>USERNAME</label>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                    style={fieldInputStyle}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={fieldLabelStyle}>PASSWORD</label>
                  <PasswordInput
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    style={fieldInputStyle}
                  />
                </div>

                {error && <div style={errorBannerStyle}>{error}</div>}

                <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
                  {loading ? "SIGNING IN…" : "SIGN IN"}
                </button>

                <button
                  type="button"
                  style={{ ...linkButtonStyle, textAlign: "right" }}
                  onClick={() => { setNotice(""); setMode("forgot"); }}
                >
                  Forgot password?
                </button>
              </form>

              <div style={{ marginTop: "28px", textAlign: "center" }}>
                <span style={{ fontSize: "13px", color: "rgba(140,180,220,0.6)" }}>
                  Don&apos;t have an account?{" "}
                </span>
                <Link href="/signup" style={{ fontSize: "13px", color: "#00d2ff", textDecoration: "none" }}>
                  Sign up
                </Link>
              </div>
            </>
          ) : (
            <ForgotPasswordFlow
              onDone={(message) => {
                setNotice(message);
                setMode("login");
              }}
            />
          )}

          <div style={{ marginTop: "36px", borderTop: "1px solid rgba(0,100,200,0.2)" }} />
          <p style={{ marginTop: "16px", fontSize: "12px", color: "rgba(100,150,200,0.5)", textAlign: "center" }}>
            REFEREE INSIGHT &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  );
}
