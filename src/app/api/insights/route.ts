import { spawn } from "child_process";
import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

function serializeReport(r: Awaited<ReturnType<typeof fetchReports>>[number], index: number) {
  const date = new Date(r.match.matchDate).toISOString().slice(0, 10);
  const time = new Date(r.match.matchTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

  const crew: string[] = [];
  const crewMap = [
    { pos: "Referee",             name: r.match.refereeCrewName,  from: r.feedbackFromReferee, for: r.feedbackForReferee },
    { pos: "Assistant Referee 1", name: r.match.ar1CrewName,      from: r.feedbackFromAr1,     for: r.feedbackForAr1     },
    { pos: "Assistant Referee 2", name: r.match.ar2CrewName,      from: r.feedbackFromAr2,     for: r.feedbackForAr2     },
    { pos: "4th Official",        name: r.match.fourthCrewName,   from: r.feedbackFromFourth,  for: r.feedbackForFourth  },
  ];
  for (const c of crewMap) {
    if (!c.name || c.name === "N/A") continue;
    let line = `  ${c.pos}: ${c.name}`;
    if (c.from) line += `\n    → They said: "${c.from}"`;
    if (c.for)  line += `\n    → I noted: "${c.for}"`;
    crew.push(line);
  }

  const wentWell  = [r.wentWell1,  r.wentWell2,  r.wentWell3].filter(Boolean);
  const toImprove = [r.toImprove1, r.toImprove2, r.toImprove3].filter(Boolean);
  const cards     = r.match.misconducts.map(m =>
    `${m.type} (${m.recipientType === "PLAYER" ? "Player" : "Staff"} #${m.number ?? "?"} ${m.name}, ${m.minute}') – ${m.reason}`
  );

  return [
    `Match ${index + 1} — Report #${r.id}`,
    `Date: ${date} at ${time}`,
    `${r.match.homeTeam} vs ${r.match.awayTeam} | ${r.match.league} | ${r.match.ageGroup}`,
    `My position: ${r.position.name}`,
    crew.length     ? `Crew:\n${crew.join("\n")}`                          : null,
    wentWell.length ? `Went well:\n${wentWell.map(w => `  • ${w}`).join("\n")}`    : null,
    toImprove.length? `To improve:\n${toImprove.map(t => `  • ${t}`).join("\n")}` : null,
    r.personalReflection ? `Personal reflection: ${r.personalReflection}` : null,
    cards.length    ? `Cards issued:\n${cards.map(c => `  • ${c}`).join("\n")}`    : null,
  ].filter(Boolean).join("\n");
}

async function fetchReports(userId: number, limit: number) {
  const prisma = await getPrisma();
  return prisma.matchReport.findMany({
    where: { userId },
    include: {
      position: true,
      match: { include: { misconducts: { orderBy: { minute: "asc" } } } },
    },
    orderBy: [{ match: { matchDate: "desc" } }, { match: { matchTime: "desc" } }],
    take: limit,
  });
}

const CLAUDE_BIN = "/Users/mgeis/.local/bin/claude";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return new Response("Not authenticated.", { status: 401 });

  const { question, limit = 20 } = await req.json();

  if (!question?.trim()) {
    return new Response("No question provided.", { status: 400 });
  }

  logEvent("AI_INSIGHTS_REQUESTED", { userId, question: question.trim() });

  const reports = await fetchReports(userId, limit);

  if (reports.length === 0) {
    return new Response("No match reports found. Add some reports first.", { status: 200 });
  }

  const context = reports
    .map((r, i) => serializeReport(r, i))
    .join("\n\n─────────────────────────────\n\n");

  const fullPrompt = `You are a soccer referee development coach. You have access to a referee's personal match report journal and your job is to help them understand patterns, track development, and identify areas of focus.

When answering:
- Be specific and cite actual matches, dates, and quotes from their own notes where relevant
- Look for genuine trends rather than restating everything
- Be encouraging but honest — this is a development tool
- Use clear formatting with headers or bullets where it helps readability
- Keep answers focused and actionable

Match reports (${reports.length} total, most recent first):

${context}

─────────────────────────────

Question: ${question}`;

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    start(controller) {
      const proc = spawn(CLAUDE_BIN, ["--print"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, HOME: process.env.HOME ?? "/Users/mgeis" },
      });

      proc.stdin.write(fullPrompt, "utf8");
      proc.stdin.end();

      proc.stdout.on("data", (chunk: Buffer) => {
        controller.enqueue(encoder.encode(chunk.toString("utf8")));
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        // Surface stderr only if it looks like a real error, not a progress line
        const msg = chunk.toString("utf8").trim();
        if (msg && !msg.startsWith("✓") && !msg.startsWith("� ")) {
          console.error("[claude stderr]", msg);
        }
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          controller.enqueue(encoder.encode(`\n\n[Process exited with code ${code}]`));
        }
        controller.close();
      });

      proc.on("error", (err: Error) => {
        controller.enqueue(encoder.encode(`Error: ${err.message}`));
        controller.close();
      });
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
