import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserIdFromCookies } from "@/lib/session";

const GUIDES = [
  {
    href: "/dashboard/help/creating-a-match-report",
    title: "Creating a Match Report",
    description: "Walk through adding a new match report, including crew, feedback, and misconducts.",
  },
  {
    href: "/dashboard/help/mcp-server-setup",
    title: "Connecting Claude to the Referee Insight MCP Server",
    description: "Generate a personal access token and connect an MCP-aware AI client to your own match report data.",
  },
  {
    href: "/dashboard/help/rest-api-setup",
    title: "Using the Referee Insight REST API",
    description: "List, view, and create your match reports from an external script or service using a personal access token.",
  },
];

export default async function HelpIndexPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  return (
    <div className="p-6 lg:p-10" style={{ maxWidth: "760px", backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Help</h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
          Guides for using Referee Insight.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {GUIDES.map(g => (
          <Link
            key={g.href}
            href={g.href}
            style={{
              display: "block", padding: "18px 20px", borderRadius: "10px", textDecoration: "none",
              background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ color: "#00d2ff", fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
              {g.title}
            </div>
            <div style={{ color: "rgba(140,180,220,0.65)", fontSize: "13px", lineHeight: "1.5" }}>
              {g.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
