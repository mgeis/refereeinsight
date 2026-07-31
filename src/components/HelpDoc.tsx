"use client";

import { useState } from "react";
import Link from "next/link";

export function DocPage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-10" style={{ maxWidth: "760px", backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>
      <div style={{ marginBottom: "8px" }}>
        <Link href="/dashboard/help" style={{ fontSize: "12px", color: "rgba(0,180,255,0.7)", textDecoration: "none" }}>
          ← Back to Help
        </Link>
      </div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#e8f4ff", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>{title}</h1>
        {subtitle && <p style={{ color: "rgba(120,170,220,0.65)", fontSize: "14px" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {children}
      </div>
    </div>
  );
}

export function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ color: "#00d2ff", fontSize: "15px", fontWeight: 700, letterSpacing: "0.02em", marginBottom: "10px" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </section>
  );
}

export function DocP({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ color: "rgba(200,225,255,0.85)", fontSize: "14px", lineHeight: "1.7", ...style }}>{children}</p>;
}

export function DocSteps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "0", listStyle: "none", counterReset: "step" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "rgba(200,225,255,0.85)", lineHeight: "1.6" }}>
          <span style={{
            flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%",
            background: "rgba(0,150,255,0.15)", border: "1px solid rgba(0,150,255,0.35)",
            color: "#00d2ff", fontSize: "11px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {i + 1}
          </span>
          <span style={{ paddingTop: "2px" }}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function DocCode({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ border: "1px solid rgba(0,100,200,0.25)", borderRadius: "8px", overflow: "hidden" }}>
      {label && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 8px 6px 14px", fontSize: "10px", letterSpacing: "0.08em", color: "rgba(100,150,200,0.7)",
          background: "rgba(0,20,50,0.8)", borderBottom: "1px solid rgba(0,100,200,0.2)",
        }}>
          <span>{label.toUpperCase()}</span>
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
      )}
      <div style={{ position: "relative" }}>
        {!label && (
          <div style={{ position: "absolute", top: "8px", right: "8px" }}>
            <CopyButton copied={copied} onClick={handleCopy} />
          </div>
        )}
        <pre style={{
          margin: 0, padding: "14px 16px", background: "rgba(0,10,30,0.75)",
          overflowX: "auto", fontSize: "12.5px", lineHeight: "1.6",
          color: "#c8e8ff", fontFamily: "monospace",
        }}>
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em", padding: "4px 9px", borderRadius: "5px",
        cursor: "pointer", border: "1px solid rgba(0,150,255,0.3)",
        background: "rgba(0,100,200,0.15)", color: "#00d2ff", flexShrink: 0,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function DocNote({ kind = "info", children }: { kind?: "info" | "warning"; children: React.ReactNode }) {
  const isWarning = kind === "warning";
  return (
    <div style={{
      display: "flex", gap: "10px", padding: "12px 16px", borderRadius: "8px",
      background: isWarning ? "rgba(255,180,0,0.08)" : "rgba(0,150,255,0.08)",
      border: `1px solid ${isWarning ? "rgba(255,180,0,0.3)" : "rgba(0,150,255,0.25)"}`,
      fontSize: "13px", lineHeight: "1.6",
      color: isWarning ? "#f5c400" : "rgba(180,220,255,0.9)",
    }}>
      <span style={{ flexShrink: 0 }}>{isWarning ? "⚠" : "ℹ"}</span>
      <span>{children}</span>
    </div>
  );
}

export function DocImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ border: "1px solid rgba(0,100,200,0.25)", borderRadius: "8px", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "auto" }} />
      </div>
      {caption && (
        <figcaption style={{ marginTop: "6px", fontSize: "12px", color: "rgba(100,150,200,0.6)", textAlign: "center" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
