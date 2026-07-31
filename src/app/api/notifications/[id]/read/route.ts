import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

// POST /api/notifications/[id]/read — mark one notification as read.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const prisma = await getPrisma();

  const existing = await prisma.notification.findFirst({ where: { id: Number(id), userId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Idempotent — already-read notifications just succeed as a no-op.
  await prisma.notification.updateMany({
    where: { id: Number(id), userId, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
