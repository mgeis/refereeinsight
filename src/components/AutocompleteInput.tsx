"use client";

import { useEffect, useRef, useState } from "react";

type Colleague = { id: number; firstName: string; lastName: string };

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const baseInputStyle: React.CSSProperties = {
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

export function AutocompleteInput({ value, onChange, placeholder, disabled }: Props) {
  const [suggestions, setSuggestions] = useState<Colleague[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions on value change
  useEffect(() => {
    if (disabled || value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/colleagues?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data: Colleague[] = await res.json();
          setSuggestions(data);
          setOpen(data.length > 0);
          setActiveIndex(-1);
        }
      } catch {}
    }, 220);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, disabled]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function select(colleague: Colleague) {
    onChange(`${colleague.firstName} ${colleague.lastName}`.trim());
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Not applicable" : placeholder}
        disabled={disabled}
        style={{
          ...baseInputStyle,
          opacity: disabled ? 0.35 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onMouseEnter={e => { if (!disabled) (e.target as HTMLInputElement).style.borderColor = "rgba(0,210,255,0.5)"; }}
        onMouseLeave={e => { if (!disabled && document.activeElement !== e.target) (e.target as HTMLInputElement).style.borderColor = "rgba(0,150,255,0.25)"; }}
        onFocusCapture={e => { if (!disabled) e.target.style.borderColor = "rgba(0,210,255,0.5)"; }}
        onBlurCapture={e => { if (!disabled) e.target.style.borderColor = "rgba(0,150,255,0.25)"; }}
      />

      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#071e3d",
          border: "1px solid rgba(0,150,255,0.3)",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {suggestions.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => select(c)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                textAlign: "left",
                padding: "9px 14px",
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                transition: "background 0.1s",
                background: i === activeIndex ? "rgba(0,120,255,0.25)" : "transparent",
                color: i === activeIndex ? "#e8f4ff" : "rgba(180,215,250,0.85)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1 11c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {c.firstName} {c.lastName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
