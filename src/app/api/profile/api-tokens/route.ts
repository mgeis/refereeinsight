import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { generateApiToken, hashApiToken } from "@/lib/apiTokens";
import { logEvent } from "@/lib/events";

// GET /api/profile/api-tokens — list the current user's tokens (never the plaintext)
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const prisma = await getPrisma();
  const tokens = await prisma.apiToken.findMany({
    where: { userId },
    select: { id: true, label: true, createdAt: true, lastUsedAt: true, revokedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tokens);
}

// POST /api/profile/api-tokens  body: { label?: string }
// Returns the plaintext token — this is the only time it's ever visible.
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { label } = await req.json().catch(() => ({ label: undefined }));

  const token = generateApiToken();
  const prisma = await getPrisma();
  const record = await prisma.apiToken.create({
    data: { userId, tokenHash: hashApiToken(token), label: label?.trim() || null },
    select: { id: true, label: true, createdAt: true },
  });

  logEvent("API_TOKEN_CREATED", { userId, tokenId: record.id, label: record.label });

  return NextResponse.json({ ...record, token }, { status: 201 });
}
