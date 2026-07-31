import { Fragment } from "react";
import { redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { DocPage, DocSection, DocP, DocSteps, DocCode, DocNote, DocImage } from "@/components/HelpDoc";

export default async function McpServerSetupHelpPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  return (
    <DocPage
      title="Connecting Claude to the Referee Insight MCP Server"
      subtitle="Let an MCP-aware AI client read your match report data directly, so you can ask it questions in natural language."
    >
      <DocSection title="What this does">
        <DocP>
          Referee Insight exposes an MCP (Model Context Protocol) server at <code>/api/mcp</code>.
          Once connected, an AI client like Claude can call into your account to list and read your
          match reports and colleagues — so you can ask things like &quot;how many cautions have I
          issued this season?&quot; and get an answer grounded in your real data, instead of a guess.
        </DocP>
        <DocNote>
          If you have the <strong>Administrator</strong>{" "}role, the same tools return every
          referee&apos;s reports, not just your own — matching what you can already see in the
          Admin section of the app.
        </DocNote>
      </DocSection>

      <DocSection title="Step 1 — Generate a personal access token">
        <DocSteps
          items={[
            <Fragment key="generate">Go to <strong>Profile</strong>, and find the <strong>MCP Access Tokens</strong> section near the bottom.</Fragment>,
            <Fragment key="label">Optionally give it a label (e.g. &quot;Claude Desktop&quot;) so you can tell tokens apart later, then click <strong>GENERATE TOKEN</strong>.</Fragment>,
          ]}
        />
        <DocImage
          src="/help/mcp-tokens-section.png"
          alt="The MCP Access Tokens section on the Profile page, with a label field and Generate Token button"
          caption="Profile → MCP Access Tokens"
        />
        <DocSteps
          items={[
            <Fragment key="copy">Your token is shown <strong>once</strong>. Copy it immediately — Referee Insight only stores a hash of it and can never show you the value again.</Fragment>,
          ]}
        />
        <DocImage
          src="/help/mcp-token-generated.png"
          alt="A newly generated MCP token shown once, with a Copy button"
          caption="Copy the token now — this is the only time it's visible"
        />
        <DocNote kind="warning">
          Treat this token like a password. Anyone with it can read your match report data (or, if
          you&apos;re an admin, everyone&apos;s) until you revoke it from this same page.
        </DocNote>
      </DocSection>

      <DocSection title="Step 2 — Connect your client">
        <DocP>
          If you&apos;re using <strong>Claude Code</strong>, the simplest path is the CLI:
        </DocP>
        <DocCode label="Terminal">{`claude mcp add --transport http refereeinsight \\
  http://localhost:3000/api/mcp \\
  --header "Authorization: Bearer YOUR_TOKEN_HERE"`}</DocCode>
        <DocP>
          Replace <code>YOUR_TOKEN_HERE</code> with the token from Step 1, and replace
          the URL with wherever your Referee Insight instance is actually running (this only
          works against a server you can reach — <code>localhost</code>{" "}if you&apos;re running it
          yourself, or your deployed domain otherwise).
        </DocP>
        <DocP>
          Other MCP-aware clients (Claude Desktop, etc.) support connecting to a remote HTTP MCP
          server with a custom Authorization header too, but the exact configuration format
          varies by client — check that client&apos;s own MCP documentation for how it expects
          headers to be supplied.
        </DocP>
      </DocSection>

      <DocSection title="Step 3 — Try it">
        <DocP>Once connected, just ask. For example:</DocP>
        <DocCode label="You ask">{`How many match reports have I filed this year?`}</DocCode>
        <DocP>Claude calls <code>list_match_reports</code> behind the scenes and gets back something like:</DocP>
        <DocCode label="Tool response (list_match_reports)">{`{
  "reports": [
    {
      "id": 12,
      "matchDate": "2026-06-14",
      "location": "Riverside Park Field 3",
      "homeTeam": "FC United",
      "awayTeam": "Riverside FC",
      "league": "AYSO Region 10",
      "ageGroup": "U14",
      "position": "Referee",
      "misconductCount": 2
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "pages": 2
}`}</DocCode>
        <DocP>and answers using the real <code>total</code> — not a guess.</DocP>

        <DocP style={{ marginTop: "4px" }}>A few more things you can ask:</DocP>
        <DocCode label="Examples">{`"Show me my match reports from AYSO Region 10"
"Get the full detail on match report #12"
"List my colleagues"
"How many send-offs have I issued, and in which matches?"`}</DocCode>
      </DocSection>

      <DocSection title="Available tools">
        <DocCode label="list_match_reports">{`Filters (all optional): homeTeam, awayTeam, league, ageGroup,
date (YYYY-MM-DD), page, limit
Returns: summaries (id, date, teams, league, age group,
position, misconduct count) — not full detail`}</DocCode>
        <DocCode label="get_match_report">{`Params: id (required)
Returns: full report detail, including all misconducts
and feedback fields`}</DocCode>
        <DocCode label="list_colleagues">{`Params: none
Returns: your recorded crew members (id, first/last name)`}</DocCode>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocP><strong>Requests are rejected with 401 Unauthorized.</strong></DocP>
        <DocP>
          Check that the token hasn&apos;t been revoked (Profile → MCP Access Tokens), and that
          you&apos;ve accepted the <em>current</em> version of the End User License Agreement — MCP
          access is blocked for any account whose EULA acceptance is out of date, even with an
          otherwise valid token. See the <a href="/dashboard/eula" style={{ color: "#00d2ff" }}>EULA page</a> to check.
        </DocP>

        <DocP style={{ marginTop: "8px" }}><strong>The client says it&apos;s connected, but answers seem made up.</strong></DocP>
        <DocP>
          Connecting to the server and actually calling a tool are two different things — a client
          can successfully connect without ever invoking <code>list_match_reports</code>{" "}for a
          given question, especially if the phrasing doesn&apos;t clearly signal that it needs your
          data. If an answer includes specific numbers, check your client&apos;s UI for a visible
          &quot;used tool: …&quot; indicator. If there isn&apos;t one, try rephrasing more explicitly —
          e.g. &quot;use your Referee Insight tools to check my match reports&quot; — and treat any
          answer without a visible tool call as unverified.
        </DocP>
      </DocSection>
    </DocPage>
  );
}
