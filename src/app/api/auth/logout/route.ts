import { NextRequest, NextResponse } from "next/server";
import { authProvider, SESSION_COOKIE } from "@/lib/auth/index";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (token) {
    await authProvider.invalidate(token).catch(() => {});
  }

  if (userId) logEvent("LOGOUT", { userId });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });

  return response;
}
