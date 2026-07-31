"use client";

import { useEffect, useState } from "react";

export function EulaViewer({ onLoaded }: { onLoaded?: (version: number) => void }) {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/eula")
      .then(r => r.json())
      .then(data => {
        setContent(data.content ?? "");
        setVersion(data.version ?? null);
        if (data.version) onLoaded?.(data.version);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {version && (
        <div style={{ fontSize: "11px", color: "rgba(100,150,200,0.6)", marginBottom: "8px" }}>
          Version {version}
        </div>
      )}
      <div style={{
        maxHeight: "280px",
        overflowY: "auto",
        background: "rgba(0,10,30,0.6)",
        border: "1px solid rgba(0,100,200,0.2)",
        borderRadius: "8px",
        padding: "14px 16px",
        fontSize: "12px",
        lineHeight: "1.6",
        color: "rgba(200,225,255,0.8)",
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
      }}>
        {loading ? "Loading…" : content.trim()}
      </div>
    </div>
  );
}
