"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/add-report",
    label: "Add Match Report",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/reports",
    label: "Match Reports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h12M4 8h12M4 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/data",
    label: "Data",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="11" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8.5" y="7" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/insights",
    label: "Insights",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 14l4-5 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
  }

  const currentLabel =
    NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.label ?? "Dashboard";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-10 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Top bar (mobile + desktop) */}
      <header
        className="fixed top-0 right-0 left-0 lg:left-[240px] z-10"
        style={{
          borderBottom: "1px solid rgba(0,150,255,0.1)",
          background: "rgba(0,10,25,0.92)",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backdropFilter: "blur(8px)",
        }}
      >
        <button
          className="lg:hidden"
          onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(140,180,220,0.8)", padding: "4px" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <span style={{ fontSize: "13px", letterSpacing: "0.06em", color: "rgba(100,150,200,0.5)" }}>
          {currentLabel.toUpperCase()}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 8px #00d2ff", display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "rgba(100,160,210,0.6)", letterSpacing: "0.08em" }}>ONLINE</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: "240px",
          background: "rgba(0,15,35,0.98)",
          borderRight: "1px solid rgba(0,150,255,0.12)",
        }}
      >
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(0,210,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }} />

        {/* Logo */}
        <Link href="/dashboard" className="relative z-10 flex items-center gap-3 px-6 py-6 no-underline" style={{ borderBottom: "1px solid rgba(0,150,255,0.1)" }}>
          <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
            <defs>
              <radialGradient id="sbBall" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#0a2a4a" />
                <stop offset="100%" stopColor="#010a18" />
              </radialGradient>
              <linearGradient id="sbRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#0044bb" />
              </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="21" stroke="url(#sbRing)" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="15" fill="url(#sbBall)" />
            <polygon points="22,10 26,16 24,22 20,22 18,16" fill="rgba(0,20,50,0.9)" />
            <polygon points="33,17 35,23 31,27 27,25 27,19" fill="rgba(0,20,50,0.9)" />
            <polygon points="11,17 9,23 13,27 17,25 17,19" fill="rgba(0,20,50,0.9)" />
            <circle cx="22" cy="22" r="15" fill="none" stroke="rgba(0,210,255,0.5)" strokeWidth="1" />
          </svg>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.04em", color: "#e8f4ff", lineHeight: 1.1 }}>REFEREE</div>
            <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: "#00d2ff", fontWeight: 500 }}>INSIGHT</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="relative z-10 flex flex-col gap-1 px-3 py-6 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.02em",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,80,200,0.35), rgba(0,180,255,0.15))"
                    : "transparent",
                  color: isActive ? "#00d2ff" : "rgba(160,200,240,0.7)",
                  boxShadow: isActive ? "inset 0 0 0 1px rgba(0,180,255,0.2)" : "none",
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 6px #00d2ff" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Log Out */}
        <div className="relative z-10 px-3 pb-6" style={{ borderTop: "1px solid rgba(0,150,255,0.1)", paddingTop: "16px" }}>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "rgba(160,200,240,0.5)", background: "none", border: "none", cursor: "pointer", width: "100%", transition: "color 0.15s" }}
            onMouseOver={e => (e.currentTarget.style.color = "#ff6b6b")}
            onMouseOut={e => (e.currentTarget.style.color = "rgba(160,200,240,0.5)")}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 13l-3-3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="5" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
