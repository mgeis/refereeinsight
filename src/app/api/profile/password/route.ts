import { NextRequest, NextResponse } from "next/server";
import { authProvider, SESSION_COOKIE } from "@/lib/auth/index";
import { getSessionUserId } from "@/lib/session";
import { logEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const ok = await authProvider.changeOwnPassword(token, currentPassword, newPassword);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  logEvent("PASSWORD_CHANGED", { userId });

  return NextResponse.json({ ok: true });
}
