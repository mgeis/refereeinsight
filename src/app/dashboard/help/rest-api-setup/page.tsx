import { Fragment } from "react";
import { redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { DocPage, DocSection, DocP, DocSteps, DocCode, DocNote } from "@/components/HelpDoc";

export default async function RestApiSetupHelpPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  return (
    <DocPage
      title="Using the Referee Insight REST API"
      subtitle="List, view, and create your match reports from an external script or service — authenticated with the same personal access token used for MCP."
    >
      <DocSection title="What this does">
        <DocP>
          Referee Insight exposes a versioned REST API at <code>/api/v1</code>. It&apos;s a plain
          JSON HTTP API — any language or tool that can make an HTTP request with a header can use
          it (curl, a script, a backend service, a spreadsheet macro, etc.). It covers the same
          match-report data as the MCP server, just over regular REST endpoints instead of MCP
          tool calls.
        </DocP>
        <DocNote>
          If you have the <strong>Administrator</strong>{" "}role, list/get endpoints return every
          referee&apos;s reports, not just your own — matching what you can already see in the
          Admin section of the app.
        </DocNote>
      </DocSection>

      <DocSection title="Step 1 — Generate a personal access token">
        <DocSteps
          items={[
            <Fragment key="generate">Go to <strong>Profile</strong>, and find the <strong>MCP Access Tokens</strong> section near the bottom — the same section used to connect MCP clients.</Fragment>,
            <Fragment key="label">Optionally give it a label (e.g. &quot;My Script&quot;) so you can tell tokens apart later, then click <strong>GENERATE TOKEN</strong>.</Fragment>,
            <Fragment key="copy">Copy the token immediately — it&apos;s shown <strong>once</strong>. Referee Insight only stores a hash of it and can never show you the value again.</Fragment>,
          ]}
        />
        <DocNote kind="warning">
          Treat this token like a password. Anyone with it can read (and create reports as) your
          account — or, if you&apos;re an admin, everyone&apos;s — until you revoke it from that
          same page.
        </DocNote>
      </DocSection>

      <DocSection title="Step 2 — Authenticate your requests">
        <DocP>
          Every request needs an <code>Authorization</code> header carrying the token as a bearer
          credential:
        </DocP>
        <DocCode label="Header">{`Authorization: Bearer YOUR_TOKEN_HERE`}</DocCode>
        <DocP>
          Replace the base URL below with wherever your Referee Insight instance is actually
          running — <code>localhost</code>{" "}if you&apos;re running it yourself, or your deployed
          domain otherwise. Every example on this page uses <code>localhost:3000</code>.
        </DocP>
        <DocNote>
          A request with a missing, invalid, or revoked token gets a <code>401</code>. So does a
          valid token belonging to an account whose EULA acceptance is out of date — see{" "}
          Troubleshooting below.
        </DocNote>
      </DocSection>

      <DocSection title="Step 3 — List your match reports">
        <DocP>
          <code>GET /api/v1/match-reports</code> returns summaries, most recent match first. All
          query parameters are optional:
        </DocP>
        <DocCode label="Query parameters">{`page       page number, default 1
limit      results per page, default 20, max 100
homeTeam   partial match, case-insensitive
awayTeam   partial match, case-insensitive
league     partial match, case-insensitive
ageGroup   partial match, case-insensitive
date       exact match date, YYYY-MM-DD`}</DocCode>
        <DocCode label="curl">{`curl "http://localhost:3000/api/v1/match-reports?league=AYSO%20Region%2010&limit=5" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`}</DocCode>
        <DocCode label="Response — 200 OK">{`{
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
  "limit": 5,
  "pages": 5
}`}</DocCode>
        <DocNote>
          Summaries only — no feedback fields or misconduct detail. Use Step 4 to fetch one
          report&apos;s full detail.
        </DocNote>
      </DocSection>

      <DocSection title="Step 4 — Get a single report">
        <DocP>
          <code>GET /api/v1/match-reports/{"{id}"}</code> returns full detail for one report,
          including misconducts and every feedback/reflection field. Returns <code>404</code>{" "}
          if the report doesn&apos;t exist or you&apos;re not authorized to see it (not your own,
          and you&apos;re not an admin).
        </DocP>
        <DocCode label="curl">{`curl "http://localhost:3000/api/v1/match-reports/12" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`}</DocCode>
        <DocCode label="Response — 200 OK">{`{
  "id": 12,
  "userId": 3,
  "matchId": 9,
  "positionId": 1,
  "feedbackFromReferee": null,
  "feedbackFromAr1": "Good angle on the offside call in the 60th.",
  "feedbackFromAr2": null,
  "feedbackFromFourth": null,
  "feedbackForReferee": null,
  "feedbackForAr1": "Solid flag work all match.",
  "feedbackForAr2": null,
  "feedbackForFourth": null,
  "personalReflection": "Communicated well with both ARs.",
  "wentWell1": "Game management",
  "wentWell2": null,
  "wentWell3": null,
  "toImprove1": "Positioning on transitions",
  "toImprove2": null,
  "toImprove3": null,
  "createdAt": "2026-06-14T21:05:11.000Z",
  "updatedAt": "2026-06-14T21:05:11.000Z",
  "position": { "id": 1, "name": "Referee" },
  "match": {
    "id": 9,
    "matchDate": "2026-06-14T00:00:00.000Z",
    "matchTime": "1970-01-01T18:00:00.000Z",
    "location": "Riverside Park Field 3",
    "homeTeam": "FC United",
    "awayTeam": "Riverside FC",
    "league": "AYSO Region 10",
    "ageGroup": "U14",
    "refereeCrewName": null,
    "ar1CrewName": "Sam Lee",
    "ar2CrewName": null,
    "fourthCrewName": null,
    "misconducts": [
      {
        "id": 4,
        "matchId": 9,
        "type": "CAUTION",
        "recipientType": "PLAYER",
        "minute": 57,
        "number": "10",
        "name": "J. Alvarez",
        "reason": "Dissent",
        "description": null
      }
    ]
  }
}`}</DocCode>
      </DocSection>

      <DocSection title="Step 5 — Create a report">
        <DocP>
          <code>POST /api/v1/match-reports</code> creates a report under <strong>your</strong>{" "}
          account (the report&apos;s owner is always whoever the bearer token belongs to). A
          position and a match are always required — the match can be an existing one you attach
          to, or a brand new one created inline. There are two ways to supply it:
        </DocP>

        <DocP style={{ marginTop: "4px" }}>
          <strong>Use case A — attach to a match someone else already logged.</strong>{" "}Pass{" "}
          <code>matchId</code>. Fails with <code>404</code>{" "}if that match doesn&apos;t exist, or{" "}
          <code>409</code>{" "}if you already have a report for it.
        </DocP>
        <DocCode label="curl — existing match">{`curl -X POST "http://localhost:3000/api/v1/match-reports" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "matchId": 9,
    "positionId": 2,
    "feedbackFromReferee": "Clear communication all match.",
    "wentWell1": "Kept up with the play",
    "toImprove1": "Flag signal timing on close offsides"
  }'`}</DocCode>

        <DocP style={{ marginTop: "4px" }}>
          <strong>Use case B — log a brand new match.</strong>{" "}Pass a <code>match</code>{" "}
          object instead of <code>matchId</code>. All fields shown below except the crew names are
          required; <code>matchTime</code>{" "}is 24-hour <code>HH:MM</code>.
        </DocP>
        <DocCode label="curl — new match">{`curl -X POST "http://localhost:3000/api/v1/match-reports" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "positionId": 1,
    "match": {
      "matchDate": "2026-07-19",
      "matchTime": "18:00",
      "location": "Riverside Park Field 3",
      "homeTeam": "FC United",
      "awayTeam": "Riverside FC",
      "league": "AYSO Region 10",
      "ageGroup": "U14",
      "refereeCrewName": null,
      "ar1CrewName": "Sam Lee",
      "ar2CrewName": null,
      "fourthCrewName": null
    },
    "personalReflection": "Communicated well with both ARs."
  }'`}</DocCode>

        <DocP style={{ marginTop: "4px" }}>
          <strong>Use case C — record misconducts (Referee position only).</strong>{" "}Add a{" "}
          <code>misconducts</code>{" "}array to either request above. It&apos;s silently ignored
          unless <code>positionId</code>{" "}resolves to the Referee position — misconducts are a
          fact about the match, and only the center referee&apos;s report may create them.
        </DocP>
        <DocCode label="curl — new match with misconducts">{`curl -X POST "http://localhost:3000/api/v1/match-reports" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "positionId": 1,
    "match": {
      "matchDate": "2026-07-19",
      "matchTime": "18:00",
      "location": "Riverside Park Field 3",
      "homeTeam": "FC United",
      "awayTeam": "Riverside FC",
      "league": "AYSO Region 10",
      "ageGroup": "U14"
    },
    "misconducts": [
      {
        "type": "CAUTION",
        "recipientType": "PLAYER",
        "minute": 57,
        "number": "10",
        "name": "J. Alvarez",
        "reason": "Dissent",
        "description": null
      },
      {
        "type": "SENDOFF",
        "recipientType": "TEAM_STAFF",
        "minute": 78,
        "number": null,
        "name": "Coach R. Patel",
        "reason": "Serious foul play protest",
        "description": "Entered field of play arguing a call."
      }
    ]
  }'`}</DocCode>
        <DocCode label="Fields — misconducts[]">{`type            "CAUTION" | "SENDOFF"
recipientType   "PLAYER" | "TEAM_STAFF"
minute          number, required
number          string or null — player/staff number, optional
name            string, required
reason          string, required
description     string or null, optional`}</DocCode>

        <DocCode label="Fields — all POST bodies">{`positionId            required — see "Position IDs" below
matchId               required unless "match" is given
match                 required unless "matchId" is given
  matchDate           "YYYY-MM-DD", required
  matchTime           "HH:MM" (24-hour), required
  location            string, required
  homeTeam            string, required
  awayTeam            string, required
  league              string, required
  ageGroup            string, required
  refereeCrewName     string or null, optional
  ar1CrewName         string or null, optional
  ar2CrewName         string or null, optional
  fourthCrewName      string or null, optional
feedbackFromReferee   string or null, optional
feedbackFromAr1       string or null, optional
feedbackFromAr2       string or null, optional
feedbackFromFourth    string or null, optional
feedbackForReferee    string or null, optional
feedbackForAr1        string or null, optional
feedbackForAr2        string or null, optional
feedbackForFourth     string or null, optional
personalReflection    string or null, optional
wentWell1/2/3         string or null, optional
toImprove1/2/3        string or null, optional
misconducts           array, optional — see above (Referee position only)`}</DocCode>

        <DocNote>
          <strong>Position IDs</strong>{" "}are fixed and seeded once per deployment: <code>1</code>{" "}
          Referee, <code>2</code>{" "}Assistant Referee 1, <code>3</code>{" "}Assistant Referee 2,{" "}
          <code>4</code>{" "}4th Official.
        </DocNote>

        <DocCode label="Response — 201 Created">{`{
  "id": 34,
  "userId": 5,
  "matchId": 28,
  "positionId": 1,
  "feedbackFromReferee": null,
  ...
  "match": { "id": 28, "homeTeam": "FC United", "awayTeam": "Riverside FC", ... },
  "position": { "id": 1, "name": "Referee" }
}`}</DocCode>
      </DocSection>

      <DocSection title="Errors">
        <DocP>All errors return a JSON body shaped like <code>{`{ "error": "..." }`}</code>.</DocP>
        <DocCode label="Status codes">{`401  Missing, invalid, or revoked token — or a stale EULA acceptance
400  Missing/invalid fields (e.g. no position, or a match with fields missing)
404  matchId doesn't exist, or a report id doesn't exist / isn't yours to see
409  You already have a report for this match, or someone already has a
     report for this position on this match`}</DocCode>
      </DocSection>

      <DocSection title="Troubleshooting">
        <DocP><strong>Requests are rejected with 401 Unauthorized.</strong></DocP>
        <DocP>
          Check that the token hasn&apos;t been revoked (Profile → MCP Access Tokens), and that
          you&apos;ve accepted the <em>current</em> version of the End User License Agreement — API
          access is blocked for any account whose EULA acceptance is out of date, even with an
          otherwise valid token. See the <a href="/dashboard/eula" style={{ color: "#00d2ff" }}>EULA page</a> to check.
        </DocP>

        <DocP style={{ marginTop: "8px" }}><strong>A create request returns 409.</strong></DocP>
        <DocP>
          Either you already have a report for that match (one report per user per match), or
          another referee already filed the report for that exact position on that match (one
          report per position per match). Use Step 3 to check what already exists before creating.
        </DocP>

        <DocP style={{ marginTop: "8px" }}><strong>Misconducts I sent aren&apos;t showing up.</strong></DocP>
        <DocP>
          Misconducts are only accepted when <code>positionId</code>{" "}resolves to Referee
          (id <code>1</code>{" "}in a standard deployment) — they&apos;re silently dropped for any
          other position, since only the center referee&apos;s report can record them.
        </DocP>
      </DocSection>
    </DocPage>
  );
}
