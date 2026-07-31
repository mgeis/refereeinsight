"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const PROFILE_ITEM = {
  href: "/dashboard/profile",
  label: "Profile",
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const NOTIFICATIONS_ITEM = {
  href: "/dashboard/notifications",
  label: "Notifications",
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 8a5 5 0 0 1 10 0c0 3 1 4.5 1.5 5H3.5C4 12.5 5 11 5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const REFEREE_ITEMS = [
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

// "Users", "Invites", "Match Reports", and "Notifications" are wired up;
// the rest are placeholders — not linked yet.
const ADMIN_ITEMS: { label: string; href?: string }[] = [
  { label: "Users", href: "/dashboard/admin/users" },
  { label: "Invites", href: "/dashboard/admin/invites" },
  { label: "Match Reports", href: "/dashboard/admin/reports" },
  { label: "Notifications", href: "/dashboard/admin/notifications" },
  { label: "Data" },
  { label: "Insights" },
];

const ALL_LINKED_ITEMS = [
  PROFILE_ITEM,
  NOTIFICATIONS_ITEM,
  ...REFEREE_ITEMS,
  ...ADMIN_ITEMS.filter((i): i is { label: string; href: string } => !!i.href),
];

function CaretIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
    >
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHeading({
  label, open, onToggle,
}: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 14px",
        marginTop: "8px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.1em",
        color: "rgba(100,150,200,0.6)",
      }}
    >
      {label.toUpperCase()}
      <CaretIcon open={open} />
    </button>
  );
}

export function Sidebar({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [refereeOpen, setRefereeOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  const isReferee = roles.includes("REFEREE");
  const isAdmin   = roles.includes("ADMINISTRATOR");

  // Re-fetched on every navigation, and whenever a notifications page marks
  // something read in place (no navigation involved in that case). Personal
  // and admin counts are separate inboxes, fetched independently.
  useEffect(() => {
    function refresh() {
      fetch("/api/notifications/unread-count")
        .then(r => r.json())
        .then(data => setUnreadCount(data.count ?? 0))
        .catch(() => {});
      if (isAdmin) {
        fetch("/api/notifications/unread-count?scope=admin")
          .then(r => r.json())
          .then(data => setAdminUnreadCount(data.count ?? 0))
          .catch(() => {});
      }
    }
    refresh();
    window.addEventListener("notifications:refresh", refresh);
    return () => window.removeEventListener("notifications:refresh", refresh);
  }, [pathname, isAdmin]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
  }

  const currentLabel =
    ALL_LINKED_ITEMS.find((i) => pathname.startsWith(i.href))?.label ?? "Dashboard";

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

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <Link
            href="/dashboard/help"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "12px", letterSpacing: "0.04em", color: "rgba(160,200,240,0.75)",
              textDecoration: "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.7 5.8a1.8 1.8 0 1 1 2.6 1.6c-.6.3-.8.6-.8 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7.5" cy="10.7" r="0.5" fill="currentColor" />
            </svg>
            Help
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 8px #00d2ff", display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: "rgba(100,160,210,0.6)", letterSpacing: "0.08em" }}>ONLINE</span>
          </div>
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
          {(() => {
            const isActive = pathname.startsWith(PROFILE_ITEM.href);
            return (
              <Link
                href={PROFILE_ITEM.href}
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
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{PROFILE_ITEM.icon}</span>
                {PROFILE_ITEM.label}
                {isActive && (
                  <span style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 6px #00d2ff" }} />
                )}
              </Link>
            );
          })()}

          {(() => {
            const isActive = pathname.startsWith(NOTIFICATIONS_ITEM.href);
            return (
              <Link
                href={NOTIFICATIONS_ITEM.href}
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
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{NOTIFICATIONS_ITEM.icon}</span>
                {NOTIFICATIONS_ITEM.label}
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: "auto", minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "9px",
                    background: "#ff4d4d", color: "#fff", fontSize: "10px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 6px rgba(255,60,60,0.5)",
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })()}

          {isReferee && (
            <>
              <SectionHeading label="Referee" open={refereeOpen} onToggle={() => setRefereeOpen(v => !v)} />
              {refereeOpen && REFEREE_ITEMS.map((item) => {
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
            </>
          )}

          {isAdmin && (
            <>
              <SectionHeading label="Admin" open={adminOpen} onToggle={() => setAdminOpen(v => !v)} />
              {adminOpen && ADMIN_ITEMS.map((item) => {
                if (!item.href) {
                  return (
                    <div
                      key={item.label}
                      title="Coming soon"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        letterSpacing: "0.02em",
                        color: "rgba(160,200,240,0.3)",
                        cursor: "default",
                      }}
                    >
                      {item.label}
                    </div>
                  );
                }
                const isActive = pathname.startsWith(item.href);
                const showBadge = item.label === "Notifications" && adminUnreadCount > 0;
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
                    {item.label}
                    {showBadge && (
                      <span style={{
                        marginLeft: "auto", minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "9px",
                        background: "#ff4d4d", color: "#fff", fontSize: "10px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 6px rgba(255,60,60,0.5)",
                      }}>
                        {adminUnreadCount > 99 ? "99+" : adminUnreadCount}
                      </span>
                    )}
                    {isActive && !showBadge && (
                      <span style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: "#00d2ff", boxShadow: "0 0 6px #00d2ff" }} />
                    )}
                  </Link>
                );
              })}
            </>
          )}
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
