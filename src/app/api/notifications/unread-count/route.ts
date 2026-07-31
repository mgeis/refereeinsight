import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { resolveScope } from "@/lib/notifications";

// GET /api/notifications/unread-count?scope=personal|admin — for the sidebar badges.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ count: 0 });

  const sp = req.nextUrl.searchParams;
  const resolved = await resolveScope(userId, sp);
  if ("error" in resolved) return NextResponse.json({ count: 0 });

  const prisma = await getPrisma();
  const count = await prisma.notification.count({
    where: { userId, isAdminAlert: resolved.scope === "admin", readAt: null },
  });

  return NextResponse.json({ count });
}
