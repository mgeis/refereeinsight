import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

// DELETE /api/profile/api-tokens/[id] — revoke (not hard-delete, keeps an audit trail)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const prisma = await getPrisma();

  const { count } = await prisma.apiToken.updateMany({
    where: { id: Number(id), userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });

  logEvent("API_TOKEN_REVOKED", { userId, tokenId: Number(id) });

  return NextResponse.json({ revoked: true });
}
