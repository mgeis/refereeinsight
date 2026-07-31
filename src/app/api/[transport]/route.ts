import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { resolveBearerToken } from "@/lib/apiAuth";
import { listMatchReportsForApi, getMatchReportForApi } from "@/lib/matchReports";
import { logEvent } from "@/lib/events";

type CallerInfo = { userId: number; isAdmin: boolean };

function getCaller(extra: { authInfo?: { extra?: Record<string, unknown> } }): CallerInfo {
  const info = extra.authInfo?.extra;
  const userId = info?.userId;
  if (typeof userId !== "number") {
    throw new Error("Missing caller identity — token did not resolve to a user.");
  }
  return { userId, isAdmin: info?.isAdmin === true };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_match_reports",
      {
        title: "List Match Reports",
        description:
          "List match reports, most recent first. Returns your own reports — or, for administrators, every referee's reports. Supports optional filters. Returns summaries only — use get_match_report for full detail including misconducts.",
        inputSchema: {
          homeTeam: z.string().optional().describe("Filter by home team name (partial match)"),
          awayTeam: z.string().optional().describe("Filter by away team name (partial match)"),
          league: z.string().optional().describe("Filter by league name (partial match)"),
          ageGroup: z.string().optional().describe("Filter by age group (partial match)"),
          date: z.string().optional().describe("Filter by exact match date, YYYY-MM-DD"),
          page: z.number().int().min(1).optional().default(1),
          limit: z.number().int().min(1).max(100).optional().default(20),
        },
      },
      async ({ homeTeam, awayTeam, league, ageGroup, date, page, limit }, extra) => {
        const { userId, isAdmin } = getCaller(extra);
        logEvent("MCP_TOOL_CALLED", { userId, tool: "list_match_reports" });

        const result = await listMatchReportsForApi({
          userId,
          isAdmin,
          filters: { homeTeam, awayTeam, league, ageGroup, date },
          page,
          limit,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    server.registerTool(
      "get_match_report",
      {
        title: "Get Match Report",
        description: "Get full detail for one match report by id, including misconducts (cautions/sendoffs) and feedback fields. Only reports you're authorized to see are returned — your own, or (for administrators) any referee's.",
        inputSchema: {
          id: z.number().int().describe("Match report id"),
        },
      },
      async ({ id }, extra) => {
        const { userId, isAdmin } = getCaller(extra);
        logEvent("MCP_TOOL_CALLED", { userId, tool: "get_match_report", reportId: id });
        const report = await getMatchReportForApi({ userId, isAdmin, id });

        if (!report) {
          return {
            content: [{ type: "text", text: `No match report found with id ${id}.` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
        };
      }
    );

    server.registerTool(
      "list_colleagues",
      {
        title: "List Colleagues",
        description: "List your own referee colleagues (crew members) recorded across your match reports.",
        inputSchema: {},
      },
      async (_args, extra) => {
        const { userId } = getCaller(extra);
        logEvent("MCP_TOOL_CALLED", { userId, tool: "list_colleagues" });
        const prisma = await getPrisma();
        const colleagues = await prisma.colleague.findMany({
          where: { userId },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                colleagues.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName })),
                null,
                2
              ),
            },
          ],
        };
      }
    );
  },
  {
    serverInfo: { name: "refereeinsight-match-reports", version: "1.0.0" },
  },
  {
    basePath: "/api",
    maxDuration: 60,
  }
);

async function verifyToken(_req: Request, bearerToken?: string) {
  const caller = await resolveBearerToken(bearerToken);
  if (!caller) return undefined;

  return {
    token: bearerToken!,
    clientId: `user:${caller.username}`,
    scopes: caller.roleNames,
    extra: {
      userId: caller.userId,
      isAdmin: caller.isAdmin,
    },
  };
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST };
