"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type FeedbackOfferDetail = {
  id: number;
  text: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  rejectionReason: string | null;
  flaggedAt: string | null;
  flagReason: string | null;
  fromReport: {
    position: { name: string };
    user: { firstName: string; lastName: string };
  };
};

type Notification = {
  id: number;
  message: string;
  link: string | null;
  kind: string | null;
  createdAt: string;
  readAt: string | null;
  feedbackOffer: FeedbackOfferDetail | null;
};

type ReasonAction = "reject" | "flag";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const actionButtonStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "5px", cursor: "pointer",
};

export function NotificationsList({ scope = "personal" }: { scope?: "personal" | "admin" }) {
  const scopeQuery = scope === "admin" ? "?scope=admin" : "";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, ReasonAction | null>>({});
  const [reasonText, setReasonText] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const fetchNotifications = useCallback((p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (scope === "admin") params.set("scope", "admin");
    fetch(`/api/notifications?${params}`)
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => { fetchNotifications(page); }, [page, fetchNotifications]);

  function broadcastRefresh() {
    window.dispatchEvent(new Event("notifications:refresh"));
  }

  async function markRead(id: number) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    broadcastRefresh();
  }

  async function markAllRead() {
    setMarkingAll(true);
    await fetch(`/api/notifications/read-all${scopeQuery}`, { method: "POST" });
    setMarkingAll(false);
    fetchNotifications(page);
    broadcastRefresh();
  }

  async function acceptOffer(notificationId: number, offerId: number) {
    setActionLoading(prev => ({ ...prev, [offerId]: true }));
    await fetch(`/api/feedback-offers/${offerId}/accept`, { method: "POST" });
    setActionLoading(prev => ({ ...prev, [offerId]: false }));
    fetchNotifications(page);
    broadcastRefresh();
  }

  function startAction(notificationId: number, action: ReasonAction) {
    setExpanded(prev => ({ ...prev, [notificationId]: action }));
    setReasonText(prev => ({ ...prev, [notificationId]: prev[notificationId] ?? "" }));
  }

  function cancelAction(notificationId: number) {
    setExpanded(prev => ({ ...prev, [notificationId]: null }));
  }

  async function submitReject(notificationId: number, offerId: number) {
    const reason = (reasonText[notificationId] ?? "").trim();
    if (!reason) return;
    setActionLoading(prev => ({ ...prev, [offerId]: true }));
    await fetch(`/api/feedback-offers/${offerId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setActionLoading(prev => ({ ...prev, [offerId]: false }));
    setExpanded(prev => ({ ...prev, [notificationId]: null }));
    fetchNotifications(page);
    broadcastRefresh();
  }

  async function submitFlag(notificationId: number, offerId: number) {
    const reason = (reasonText[notificationId] ?? "").trim();
    if (!reason) return;
    setActionLoading(prev => ({ ...prev, [offerId]: true }));
    await fetch(`/api/feedback-offers/${offerId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setActionLoading(prev => ({ ...prev, [offerId]: false }));
    setExpanded(prev => ({ ...prev, [notificationId]: null }));
    fetchNotifications(page);
    broadcastRefresh();
  }

  const hasUnread = notifications.some(n => !n.readAt);

  function renderFeedbackOfferBody(n: Notification, offer: FeedbackOfferDetail) {
    const isExpanded = expanded[n.id] ?? null;
    const busy = !!actionLoading[offer.id];
    const fromName = `${offer.fromReport.user.firstName} ${offer.fromReport.user.lastName}`;

    return (
      <div style={{ marginTop: "8px" }}>
        <div style={{
          padding: "10px 12px", borderRadius: "6px", background: "rgba(0,10,30,0.5)",
          border: "1px solid rgba(0,100,200,0.2)", fontSize: "12.5px", color: "rgba(210,230,250,0.9)",
          fontStyle: "italic", marginBottom: "8px",
        }}>
          &ldquo;{offer.text}&rdquo;
          <div style={{ marginTop: "4px", fontStyle: "normal", fontSize: "11px", color: "rgba(120,170,220,0.6)" }}>
            — {fromName}, {offer.fromReport.position.name}
          </div>
        </div>

        {offer.status === "PENDING" && isExpanded === null && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => acceptOffer(n.id, offer.id)}
              disabled={busy}
              style={{ ...actionButtonStyle, border: "1px solid rgba(0,200,120,0.35)", background: "rgba(0,180,100,0.12)", color: "#5fd98a" }}
            >
              Accept
            </button>
            <button
              onClick={() => startAction(n.id, "reject")}
              disabled={busy}
              style={{ ...actionButtonStyle, border: "1px solid rgba(255,80,80,0.25)", background: "rgba(255,60,60,0.08)", color: "#ff8080" }}
            >
              Reject
            </button>
            {!offer.flaggedAt && (
              <button
                onClick={() => startAction(n.id, "flag")}
                disabled={busy}
                style={{ ...actionButtonStyle, border: "1px solid rgba(255,180,0,0.3)", background: "rgba(255,180,0,0.08)", color: "#f5c400" }}
              >
                Flag
              </button>
            )}
          </div>
        )}

        {offer.status !== "PENDING" && (
          <div style={{ fontSize: "12px", color: offer.status === "ACCEPTED" ? "#5fd98a" : "#ff8080", marginBottom: "6px" }}>
            {offer.status === "ACCEPTED" ? "Accepted — included on your report." : `Rejected: ${offer.rejectionReason}`}
            {!offer.flaggedAt && isExpanded === null && (
              <button
                onClick={() => startAction(n.id, "flag")}
                disabled={busy}
                style={{ ...actionButtonStyle, marginLeft: "10px", border: "1px solid rgba(255,180,0,0.3)", background: "rgba(255,180,0,0.08)", color: "#f5c400" }}
              >
                Flag
              </button>
            )}
          </div>
        )}

        {offer.flaggedAt && (
          <div style={{ fontSize: "11px", color: "rgba(245,196,0,0.8)", marginTop: "4px" }}>
            Flagged for review: {offer.flagReason}
          </div>
        )}

        {isExpanded && (
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <textarea
              value={reasonText[n.id] ?? ""}
              onChange={e => setReasonText(prev => ({ ...prev, [n.id]: e.target.value }))}
              placeholder={isExpanded === "reject" ? "Reason for rejecting this feedback (required)" : "Reason for flagging this feedback (required)"}
              rows={2}
              style={{
                width: "100%", background: "rgba(0,20,50,0.8)", border: "1px solid rgba(0,100,200,0.25)",
                borderRadius: "6px", padding: "8px 10px", color: "#e8f4ff", fontSize: "12.5px",
                outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => isExpanded === "reject" ? submitReject(n.id, offer.id) : submitFlag(n.id, offer.id)}
                disabled={busy || !(reasonText[n.id] ?? "").trim()}
                style={{
                  ...actionButtonStyle,
                  border: `1px solid ${isExpanded === "reject" ? "rgba(255,80,80,0.35)" : "rgba(255,180,0,0.35)"}`,
                  background: isExpanded === "reject" ? "rgba(255,60,60,0.12)" : "rgba(255,180,0,0.12)",
                  color: isExpanded === "reject" ? "#ff8080" : "#f5c400",
                  opacity: (reasonText[n.id] ?? "").trim() ? 1 : 0.5,
                }}
              >
                {busy ? "Submitting…" : isExpanded === "reject" ? "Confirm Rejection" : "Confirm Flag"}
              </button>
              <button
                onClick={() => cancelAction(n.id)}
                style={{ ...actionButtonStyle, border: "1px solid rgba(0,150,255,0.2)", background: "transparent", color: "rgba(140,180,220,0.7)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10" style={{ maxWidth: "760px", backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
            {scope === "admin" ? "Admin Notifications" : "Notifications"}
          </h1>
          <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
            {total > 0 ? `${total} notification${total !== 1 ? "s" : ""}` : "No notifications yet"}
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            style={{
              padding: "8px 16px", borderRadius: "7px", fontSize: "12px", fontWeight: 600,
              letterSpacing: "0.05em", cursor: markingAll ? "not-allowed" : "pointer",
              border: "1px solid rgba(0,150,255,0.25)", background: "rgba(0,100,200,0.12)",
              color: "rgba(140,190,230,0.9)", opacity: markingAll ? 0.6 : 1,
            }}
          >
            {markingAll ? "MARKING…" : "MARK ALL AS READ"}
          </button>
        )}
      </div>

      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", overflow: "hidden" }}>
        {loading && (
          <div style={{ padding: "48px", textAlign: "center", color: "rgba(100,150,200,0.4)", fontSize: "13px" }}>
            Loading…
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "rgba(100,150,200,0.4)", fontSize: "13px" }}>
            No notifications yet.
          </div>
        )}
        {!loading && notifications.map((n, i) => {
          const isUnread = !n.readAt;
          const isFeedbackOffer = n.kind === "feedback_offer" && n.feedbackOffer;

          const content = (
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 20px",
                borderBottom: i < notifications.length - 1 ? "1px solid rgba(0,80,180,0.1)" : "none",
                background: isUnread ? "rgba(0,80,200,0.08)" : "transparent",
              }}
            >
              <span style={{
                flexShrink: 0, marginTop: "6px", width: "7px", height: "7px", borderRadius: "50%",
                background: isUnread ? "#00d2ff" : "transparent",
                boxShadow: isUnread ? "0 0 6px #00d2ff" : "none",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: isUnread ? "#e8f4ff" : "rgba(180,210,240,0.7)", lineHeight: "1.5" }}>
                  {n.message}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(100,150,200,0.5)", marginTop: "4px" }}>
                  {formatDateTime(n.createdAt)}
                </div>
                {isFeedbackOffer && renderFeedbackOfferBody(n, n.feedbackOffer as FeedbackOfferDetail)}
              </div>
              {!isFeedbackOffer && isUnread && !n.link && (
                <button
                  onClick={() => markRead(n.id)}
                  style={{
                    flexShrink: 0, fontSize: "11px", padding: "4px 10px", borderRadius: "5px",
                    background: "rgba(0,100,200,0.12)", border: "1px solid rgba(0,120,255,0.2)",
                    color: "rgba(140,180,230,0.8)", cursor: "pointer",
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          );

          return (!isFeedbackOffer && n.link) ? (
            <Link key={n.id} href={n.link} onClick={() => { if (isUnread) markRead(n.id); }} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              {content}
            </Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
          <span style={{ fontSize: "12px", color: "rgba(100,150,200,0.5)" }}>Page {page} of {pages}</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer", border: "1px solid rgba(0,120,255,0.2)", background: "transparent", color: page === 1 ? "rgba(100,150,200,0.3)" : "rgba(140,180,220,0.7)" }}>
              ← Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: page === pages ? "not-allowed" : "pointer", border: "1px solid rgba(0,120,255,0.2)", background: "transparent", color: page === pages ? "rgba(100,150,200,0.3)" : "rgba(140,180,220,0.7)" }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
