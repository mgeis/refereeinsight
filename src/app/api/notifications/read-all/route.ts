import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { resolveScope } from "@/lib/notifications";

// POST /api/notifications/read-all?scope=personal|admin — mark every unread
// notification in that inbox as read for the current user.
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const resolved = await resolveScope(userId, sp);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const prisma = await getPrisma();
  const { count } = await prisma.notification.updateMany({
    where: { userId, isAdminAlert: resolved.scope === "admin", readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ updated: count });
}
