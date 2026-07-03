"use client";

import { useState, useRef, useEffect } from "react";

const EXAMPLES = [
  {
    icon: "📈",
    label: "Development trend",
    query: "How have I most improved as a referee over my last ten matches?",
  },
  {
    icon: "🔁",
    label: "Recurring themes",
    query: "What areas for improvement appear most consistently across all my match reports?",
  },
  {
    icon: "👥",
    label: "Crew feedback",
    query: "What patterns do you see in the feedback I receive from other crew members? Are there recurring themes?",
  },
  {
    icon: "🎯",
    label: "Position comparison",
    query: "How does my performance and feedback differ when I'm the referee versus an assistant referee?",
  },
  {
    icon: "🟨",
    label: "Card patterns",
    query: "When do I tend to issue cards, and are there any patterns in the type of misconduct or the games they occur in?",
  },
  {
    icon: "🏋️",
    label: "Training focus",
    query: "Based on my last ten match reports, what one or two things should I prioritize in my next training session?",
  },
  {
    icon: "💬",
    label: "Peer perspective",
    query: "Summarize what my crew members have said about me across all my reports. What are my strengths and blind spots from their perspective?",
  },
  {
    icon: "📅",
    label: "Recent form",
    query: "How has my confidence and decision-making been trending in my most recent five matches?",
  },
];

function renderAnswer(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      const content = line.replace(/^#+\s/, "");
      elements.push(
        <div key={key++} style={{ fontSize: "15px", fontWeight: 700, color: "#c0deff", marginTop: "18px", marginBottom: "6px", letterSpacing: "0.02em" }}>
          {content}
        </div>
      );
    } else if (/^[-•*]\s/.test(line)) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "10px", fontSize: "14px", color: "#c8dfff", lineHeight: "1.6", paddingLeft: "4px" }}>
          <span style={{ color: "rgba(0,180,255,0.5)", flexShrink: 0, marginTop: "1px" }}>›</span>
          <span>{applyInline(line.replace(/^[-•*]\s/, ""))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, "");
      const num = line.match(/^(\d+)/)?.[1];
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "10px", fontSize: "14px", color: "#c8dfff", lineHeight: "1.6", paddingLeft: "4px" }}>
          <span style={{ color: "rgba(0,180,255,0.6)", flexShrink: 0, fontWeight: 600, minWidth: "18px" }}>{num}.</span>
          <span>{applyInline(content)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "8px" }} />);
    } else {
      elements.push(
        <p key={key++} style={{ fontSize: "14px", color: "#c8dfff", lineHeight: "1.7", margin: 0 }}>
          {applyInline(line)}
        </p>
      );
    }
  }
  return elements;
}

function applyInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} style={{ color: "#e8f4ff", fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function InsightsPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "streaming" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  function selectExample(query: string) {
    setQuestion(query);
    textareaRef.current?.focus();
  }

  useEffect(() => {
    if (status === "streaming" && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [answer, status]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || status === "loading" || status === "streaming") return;

    setAnswer("");
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, limit: 20 }),
      });

      if (!res.ok || !res.body) {
        setError("Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer(prev => prev + decoder.decode(value, { stream: true }));
      }

      setStatus("done");
    } catch {
      setError("Unable to connect. Please try again.");
      setStatus("error");
    }
  }

  const busy = status === "loading" || status === "streaming";

  return (
    <div
      className="p-6 lg:p-10"
      style={{
        maxWidth: "860px",
        backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
          Insights
        </h1>
        <p style={{ color: "rgba(120,170,220,0.65)", fontSize: "14px", lineHeight: "1.5" }}>
          Ask questions about your match reports and get AI-powered analysis of your development, patterns, and areas of focus.
        </p>
      </div>

      {/* Example queries */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.5)", marginBottom: "12px", fontWeight: 600 }}>
          EXAMPLE QUESTIONS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.query}
              type="button"
              onClick={() => selectExample(ex.query)}
              disabled={busy}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(0,30,70,0.5)",
                border: "1px solid rgba(0,150,255,0.12)",
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.5 : 1,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                if (!busy) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,150,255,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,40,90,0.6)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,150,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,30,70,0.5)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <span style={{ fontSize: "15px" }}>{ex.icon}</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", color: "rgba(0,180,255,0.55)", fontWeight: 600 }}>
                  {ex.label.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "rgba(160,200,240,0.75)", lineHeight: "1.4" }}>
                {ex.query}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Question form */}
      <div
        style={{
          background: "rgba(0,20,50,0.6)",
          border: "1px solid rgba(0,150,255,0.14)",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.4), transparent)" }} />

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.5)", marginBottom: "10px", fontWeight: 600 }}>
            YOUR QUESTION
          </div>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            placeholder="Ask anything about your match reports… (Enter to submit, Shift+Enter for new line)"
            disabled={busy}
            rows={3}
            style={{
              width: "100%",
              background: "rgba(0,30,60,0.6)",
              border: "1px solid rgba(0,150,255,0.25)",
              borderRadius: "8px",
              padding: "12px 14px",
              color: "#e8f4ff",
              fontSize: "14px",
              lineHeight: "1.5",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
              opacity: busy ? 0.7 : 1,
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(0,210,255,0.5)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(0,150,255,0.25)"; }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button
              type="submit"
              disabled={busy || !question.trim()}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                background: busy || !question.trim()
                  ? "rgba(0,80,160,0.3)"
                  : "linear-gradient(135deg, #0055cc, #0099ee)",
                color: busy || !question.trim() ? "rgba(140,180,220,0.4)" : "#fff",
                fontWeight: 600,
                fontSize: "13px",
                letterSpacing: "0.07em",
                border: "none",
                cursor: busy || !question.trim() ? "not-allowed" : "pointer",
                boxShadow: busy || !question.trim() ? "none" : "0 0 16px rgba(0,120,255,0.25)",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {status === "loading" && (
                <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              )}
              {status === "loading" ? "THINKING…" : status === "streaming" ? "RECEIVING…" : "ASK"}
            </button>
          </div>
        </form>
      </div>

      {/* Answer */}
      {(status === "loading" || answer || error) && (
        <div
          ref={answerRef}
          style={{
            marginTop: "20px",
            background: "rgba(0,20,50,0.6)",
            border: "1px solid rgba(0,150,255,0.14)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,100,200,0.12)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", fontWeight: 600 }}>
              ANALYSIS
            </span>
            {status === "streaming" && (
              <span style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: "rgba(0,180,255,0.6)",
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>

          <div style={{ padding: "20px", minHeight: "80px" }}>
            {status === "loading" && !answer && (
              <div style={{ color: "rgba(120,170,220,0.5)", fontSize: "14px", fontStyle: "italic" }}>
                Analyzing your match reports…
              </div>
            )}
            {error && (
              <div style={{ color: "#ff8080", fontSize: "14px" }}>{error}</div>
            )}
            {answer && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {renderAnswer(answer)}
                {status === "streaming" && (
                  <span style={{ display: "inline-block", width: "2px", height: "16px", background: "rgba(0,180,255,0.8)", animation: "blink 0.9s step-end infinite", marginLeft: "2px", verticalAlign: "middle" }} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {status === "done" && (
        <div style={{ marginTop: "12px", textAlign: "right" }}>
          <button
            type="button"
            onClick={() => { setAnswer(""); setStatus("idle"); setQuestion(""); }}
            style={{ fontSize: "12px", color: "rgba(0,180,255,0.5)", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}
          >
            ← Ask another question
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
