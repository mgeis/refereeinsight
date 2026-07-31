import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { resolveScope } from "@/lib/notifications";

// GET /api/notifications?page=1&limit=20&scope=personal|admin
// Most recent first. scope=admin requires ADMINISTRATOR and returns the
// separate admin-alert inbox instead of the user's personal notifications.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const resolved = await resolveScope(userId, sp);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const page  = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip  = (page - 1) * limit;

  const where = { userId, isAdminAlert: resolved.scope === "admin" };

  const prisma = await getPrisma();
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        feedbackOffer: {
          include: {
            fromReport: { include: { position: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ notifications, total, page, limit, pages: Math.ceil(total / limit) });
}
