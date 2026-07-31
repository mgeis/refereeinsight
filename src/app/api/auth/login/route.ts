import { NextRequest, NextResponse } from "next/server";
import { authProvider, SESSION_COOKIE } from "@/lib/auth/index";
import { logEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const token = await authProvider.authenticate(username, password);

  if (!token) {
    logEvent("LOGIN_FAILURE", { username, ip });
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  logEvent("LOGIN_SUCCESS", { username, ip });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 8,
    path:     "/",
  });

  return response;
}
