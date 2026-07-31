import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/index";
import { logEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { username, code } = await req.json();

  if (!username?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "Username and code are required." }, { status: 400 });
  }

  const ok = await authProvider.confirmSignUp(username.trim(), code.trim());
  if (!ok) return NextResponse.json({ error: "That code is invalid or has expired." }, { status: 400 });

  logEvent("USER_VERIFIED", { username: username.trim() });

  return NextResponse.json({ ok: true });
}
