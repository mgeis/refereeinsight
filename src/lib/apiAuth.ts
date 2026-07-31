import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { hashApiToken } from "@/lib/apiTokens";
import { hasAcceptedCurrentEula } from "@/lib/eula";
import { logEvent } from "@/lib/events";

export type BearerCaller = {
  userId: number;
  username: string;
  isAdmin: boolean;
  roleNames: string[];
};

export function extractBearerToken(req: NextRequest): string | undefined {
  return req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
}

// Shared by the MCP server (src/app/api/[transport]/route.ts) and the
// external REST API (src/app/api/v1/**) — both are authenticated by the same
// per-user tokens generated from Profile → Access Tokens.
export async function resolveBearerToken(bearerToken: string | undefined): Promise<BearerCaller | null> {
  if (!bearerToken) return null;

  const prisma = await getPrisma();
  const record = await prisma.apiToken.findUnique({
    where: { tokenHash: hashApiToken(bearerToken) },
    include: { user: { include: { roles: true } } },
  });

  if (!record || record.revokedAt) return null;

  // Access requires having agreed to the current EULA version — a stale
  // acceptance (or none) blocks the token even though it's otherwise valid.
  if (!(await hasAcceptedCurrentEula(record.user.id))) {
    logEvent("API_ACCESS_DENIED_EULA", { userId: record.user.id });
    return null;
  }

  // Fire-and-forget usage tracking — not on the auth-critical path.
  prisma.apiToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  const roleNames = record.user.roles.map((r) => r.name);

  return {
    userId: record.user.id,
    username: record.user.username,
    isAdmin: roleNames.includes("ADMINISTRATOR"),
    roleNames,
  };
}
