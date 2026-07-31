import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/index";
import { logEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { username, code, newPassword } = await req.json();

  if (!username?.trim() || !code?.trim() || !newPassword) {
    return NextResponse.json({ error: "Username, code, and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const ok = await authProvider.confirmPasswordReset(username.trim(), code.trim(), newPassword);
  if (!ok) return NextResponse.json({ error: "That code is invalid or has expired." }, { status: 400 });

  logEvent("PASSWORD_RESET_COMPLETED", { username: username.trim() });

  return NextResponse.json({ ok: true });
}
