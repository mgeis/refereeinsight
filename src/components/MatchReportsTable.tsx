"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const PAGE_SIZE = 20;

export type BaseReport = {
  id: number;
};

export type ReportColumn<T> = {
  key: string; // sort key, and React key
  label: string;
  filterParam?: string; // URL param name; omit to make the column unsortable-filter-free... actually always sortable, this only controls the filter input
  filterType?: "date" | "text";
  cellStyle?: React.CSSProperties;
  render: (row: T) => React.ReactNode;
};

type SortDir = "asc" | "desc";

function SortArrow({ direction }: { direction: SortDir }) {
  return (
    <svg
      width="9" height="9" viewBox="0 0 10 10" fill="none"
      style={{ marginLeft: "5px", transform: direction === "desc" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
    >
      <path d="M5 8V2M5 2L2 5M5 2l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

type Props<T extends BaseReport> = {
  apiUrl: string;
  columns: ReportColumn<T>[];
  getDetailHref?: (row: T) => string;
  title?: string;
  emptyLabel?: string;
  subtitle: (total: number) => string;
  addReportHref?: string;
  deleteRowUrl?: (id: number) => string;
  bulkDeleteUrl?: string;
  // Key the paginated array is nested under in the API response — defaults to
  // "reports" since that's every existing caller; set this when reusing the
  // table for a different kind of list (e.g. "users").
  dataKey?: string;
};

export function MatchReportsTable<T extends BaseReport>({
  apiUrl,
  columns,
  getDetailHref,
  title = "Match Reports",
  emptyLabel = "No reports yet.",
  subtitle,
  addReportHref,
  deleteRowUrl,
  bulkDeleteUrl,
  dataKey = "reports",
}: Props<T>) {
  const selectable = !!deleteRowUrl;
  const hasActions = !!getDetailHref || !!deleteRowUrl;

  const emptyFilters = Object.fromEntries(
    columns.filter(c => c.filterParam).map(c => [c.filterParam as string, ""])
  );

  const [reports, setReports] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>(emptyFilters);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReports = useCallback(async (f: Record<string, string>, p: number, sBy: string | null, sDir: SortDir) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    for (const [key, value] of Object.entries(f)) {
      if (value) params.set(key, value);
    }
    if (sBy) {
      params.set("sortBy", sBy);
      params.set("sortDir", sDir);
    }

    try {
      const res = await fetch(`${apiUrl}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data[dataKey]);
        setTotal(data.total);
        setPages(data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, dataKey]);

  // Debounce filter changes, immediate page/sort changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchReports(filters, page, sortBy, sortDir), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, page, sortBy, sortDir, fetchReports]);

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
    setSelected(new Set());
  }

  function setFilter(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setSelected(new Set());
  }

  function clearFilters() {
    setFilters(emptyFilters);
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
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); } else { s.add(id); }
      return s;
    });
  }

  async function deleteOne(id: number) {
    if (!deleteRowUrl) return;
    setDeletingId(id);
    await fetch(deleteRowUrl(id), { method: "DELETE" });
    setDeletingId(null);
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    fetchReports(filters, page, sortBy, sortDir);
  }

  async function deleteBulk() {
    if (!bulkDeleteUrl || selected.size === 0) return;
    setBulkDeleting(true);
    await fetch(bulkDeleteUrl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setBulkDeleting(false);
    setSelected(new Set());
    fetchReports(filters, page, sortBy, sortDir);
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const colSpan = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="p-6 lg:p-10" style={{ backgroundImage: "radial-gradient(ellipse 60% 40% at 60% 10%, rgba(0,80,180,0.07) 0%, transparent 60%)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>{title}</h1>
          <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
            {subtitle(total)}
            {hasFilters && " (filtered)"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {selectable && selected.size > 0 && (
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
          {addReportHref && (
            <Link href={addReportHref} style={{ padding: "8px 16px", borderRadius: "7px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textDecoration: "none", background: "linear-gradient(135deg, #0055cc, #0099ee)", color: "#fff", boxShadow: "0 0 16px rgba(0,120,255,0.2)" }}>
              + ADD REPORT
            </Link>
          )}
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              {/* Column labels */}
              <tr style={{ borderBottom: "1px solid rgba(0,100,200,0.15)" }}>
                {selectable && (
                  <th style={{ padding: "12px 14px", width: "40px" }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      style={{ cursor: "pointer", accentColor: "#00d2ff", width: "14px", height: "14px" }} />
                  </th>
                )}
                {columns.map(col => {
                  const isActive = sortBy === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        color: isActive ? "#00d2ff" : "rgba(100,150,200,0.6)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {col.label.toUpperCase()}
                        {isActive && <SortArrow direction={sortDir} />}
                      </span>
                    </th>
                  );
                })}
                {hasActions && <th style={{ padding: "10px 14px", width: selectable ? "140px" : "90px" }} />}
              </tr>
              {/* Filter row */}
              <tr style={{ borderBottom: "1px solid rgba(0,100,200,0.15)", background: "rgba(0,10,30,0.3)" }}>
                {selectable && <td />}
                {columns.map(col => (
                  <td key={col.key} style={{ padding: "6px 14px" }}>
                    {col.filterParam && (
                      <input
                        type={col.filterType === "date" ? "date" : "text"}
                        value={filters[col.filterParam] ?? ""}
                        onChange={e => setFilter(col.filterParam as string, e.target.value)}
                        placeholder={col.filterType === "date" ? undefined : "Filter…"}
                        style={filterInputStyle}
                      />
                    )}
                  </td>
                ))}
                {hasActions && <td />}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colSpan} style={{ padding: "48px", textAlign: "center", color: "rgba(100,150,200,0.4)", fontSize: "13px" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={colSpan} style={{ padding: "48px", textAlign: "center", color: "rgba(100,150,200,0.4)", fontSize: "13px" }}>
                    {hasFilters ? "No reports match the current filters." : emptyLabel}
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
                    {selectable && (
                      <td style={{ padding: "12px 14px" }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(r.id)}
                          style={{ cursor: "pointer", accentColor: "#00d2ff", width: "14px", height: "14px" }} />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} style={{ ...cellStyle, ...col.cellStyle }}>
                        {col.render(r)}
                      </td>
                    ))}
                    {hasActions && (
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          {getDetailHref && (
                            <Link href={getDetailHref(r)} style={{
                              fontSize: "11px", padding: "4px 10px", borderRadius: "5px",
                              background: "rgba(0,100,200,0.12)", border: "1px solid rgba(0,120,255,0.2)",
                              color: "rgba(140,180,230,0.8)", textDecoration: "none",
                            }}>
                              View
                            </Link>
                          )}
                          {deleteRowUrl && (
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
                          )}
                        </div>
                      </td>
                    )}
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
