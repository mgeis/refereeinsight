"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 20;

type Position = { id: number; name: string };
type Report = {
  id: number;
  matchDate: string;
  matchTime: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  ageGroup: string;
  position: Position;
};

type Filters = {
  date: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  ageGroup: string;
};

const EMPTY_FILTERS: Filters = { date: "", location: "", homeTeam: "", awayTeam: "", league: "", ageGroup: "" };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

const cellStyle: React.CSSProperties = { padding: "12px 14px", color: "rgba(200,225,255,0.85)", whiteSpace: "nowrap" };
const filterInputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,20,50,0.8)",
  border: "1px solid rgba(0,100,200,0.2)",
  borderRadius: "5px",
  padding: "5px 8px",
  color: "#e8f4ff",
  fontSize: "11px",
  outline: "none",
  boxSizing: "border-box",
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReports = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (f.date)     params.set("date",     f.date);
    if (f.location) params.set("location", f.location);
    if (f.homeTeam) params.set("homeTeam", f.homeTeam);
    if (f.awayTeam) params.set("awayTeam", f.awayTeam);
    if (f.league)   params.set("league",   f.league);
    if (f.ageGroup) params.set("ageGroup", f.ageGroup);

    try {
      const res = await fetch(`/api/match-reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setTotal(data.total);
        setPages(data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce filter changes, immediate page changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchReports(filters, page), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, page, fetchReports]);

  function setFilter(key: keyof Filters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setSelected(new Set());
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setSelected(new Set());
  }

  const allSelected = reports.length > 0 && reports.every(r => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); reports.forEach(r => s.delete(r.id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); reports.forEach(r => s.add(r.id)); return s; });
    }
  }

  function toggleRow(id: number) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function deleteOne(id: number) {
    setDeletingId(id);
    await fetch(`/api/match-reports/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    fetchReports(filters, page);
  }

  async function deleteBulk() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    await fetch("/api/match-reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setBulkDeleting(false);
    setSelected(new Set());
    fetchReports(filters, page);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="p-6 lg:p-10" style={{ backgroundImage: "radial-gradient(ellipse 60% 40% at 60% 10%, rgba(0,80,180,0.07) 0%, transparent 60%)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Match Reports</h1>
          <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
            {total > 0 ? `${total} report${total !== 1 ? "s" : ""}` : "No reports yet"}
            {hasFilters && " (filtered)"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {selected.size > 0 && (
            <button
              onClick={deleteBulk}
              disabled={bulkDeleting}
              style={{
                padding: "8px 16px", borderRadius: "7px", fontSize: "12px", fontWeight: 600,
                letterSpacing: "0.05em", cursor: "pointer", border: "1px solid rgba(255,80,80,0.35)",
                background: "rgba(255,60,60,0.12)", color: "#ff8080",
                opacity: bulkDeleting ? 0.6 : 1,
              }}
            >
              {bulkDeleting ? "DELETING…" : `DELETE REPORTS (${selected.size})`}
            </button>
          )}
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: "8px 14px", borderRadius: "7px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(0,150,255,0.2)", background: "transparent", color: "rgba(140,180,220,0.7)" }}>
              Clear Filters
            </button>
          )}
          <Link href="/dashboard/add-report" style={{ padding: "8px 16px", borderRadius: "7px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textDecoration: "none", background: "linear-gradient(135deg, #0055cc, #0099ee)", color: "#fff", boxShadow: "0 0 16px rgba(0,120,255,0.2)" }}>
            + ADD REPORT
          </Link>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              {/* Column labels */}
              <tr style={{ borderBottom: "1px solid rgba(0,100,200,0.15)" }}>
                <th style={{ padding: "12px 14px", width: "40px" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    style={{ cursor: "pointer", accentColor: "#00d2ff", width: "14px", height: "14px" }} />
                </th>
                {["Date", "Location", "Home", "Away", "League", "Age Group"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.6)", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
                <th style={{ padding: "10px 14px", width: "140px" }} />
              </tr>
              {/* Filter row */}
              <tr style={{ borderBottom: "1px solid rgba(0,100,200,0.15)", background: "rgba(0,10,30,0.3)" }}>
                <td />
                <td style={{ padding: "6px 14px" }}>
                  <input type="date" value={filters.date} onChange={e => setFilter("date", e.target.value)}
                    style={filterInputStyle} />
                </td>
                {(["location", "homeTeam", "awayTeam", "league", "ageGroup"] as const).map(key => (
                  <td key={key} style={{ padding: "6px 14px" }}>
                    <input type="text" value={filters[key]} onChange={e => setFilter(key, e.target.value)}
                      placeholder="Filter…" style={filterInputStyle} />
                  </td>
                ))}
                <td />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "rgba(100,150,200,0.4)", fontSize: "13px" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "rgba(100,150,200,0.4)", fontSize: "13px" }}>
                    {hasFilters ? "No reports match the current filters." : "No reports yet."}
                  </td>
                </tr>
              )}
              {!loading && reports.map((r, i) => {
                const isSelected = selected.has(r.id);
                const isDeleting = deletingId === r.id;
                return (
                  <tr key={r.id} style={{
                    borderBottom: i < reports.length - 1 ? "1px solid rgba(0,80,180,0.1)" : "none",
                    background: isSelected ? "rgba(0,80,200,0.1)" : "transparent",
                    opacity: isDeleting ? 0.4 : 1,
                    transition: "background 0.1s, opacity 0.15s",
                  }}>
                    <td style={{ padding: "12px 14px" }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(r.id)}
                        style={{ cursor: "pointer", accentColor: "#00d2ff", width: "14px", height: "14px" }} />
                    </td>
                    <td style={{ ...cellStyle, color: "#00d2ff", fontVariantNumeric: "tabular-nums" }}>
                      <Link href={`/dashboard/reports/${r.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {formatDate(r.matchDate)}
                      </Link>
                    </td>
                    <td style={{ ...cellStyle, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.location}
                    </td>
                    <td style={cellStyle}>{r.homeTeam}</td>
                    <td style={cellStyle}>{r.awayTeam}</td>
                    <td style={{ ...cellStyle, color: "rgba(160,195,235,0.7)" }}>{r.league}</td>
                    <td style={{ ...cellStyle, color: "rgba(160,195,235,0.7)" }}>{r.ageGroup}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <Link href={`/dashboard/reports/${r.id}`} style={{
                          fontSize: "11px", padding: "4px 10px", borderRadius: "5px",
                          background: "rgba(0,100,200,0.12)", border: "1px solid rgba(0,120,255,0.2)",
                          color: "rgba(140,180,230,0.8)", textDecoration: "none",
                        }}>
                          View
                        </Link>
                        <button
                          onClick={() => deleteOne(r.id)}
                          disabled={isDeleting}
                          style={{
                            fontSize: "11px", padding: "4px 10px", borderRadius: "5px",
                            background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,80,80,0.2)",
                            color: "#ff8080", cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderTop: "1px solid rgba(0,100,200,0.12)",
          }}>
            <span style={{ fontSize: "12px", color: "rgba(100,150,200,0.5)" }}>
              Page {page} of {pages} &nbsp;·&nbsp; {total} reports
            </span>
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
    </div>
  );
}
