import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/index";
import { logEvent } from "@/lib/events";

// Always responds the same way regardless of whether the username exists,
// so this endpoint can't be used to enumerate registered accounts.
const GENERIC_MESSAGE = "If that account exists, a reset code has been sent to its email address.";

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username?.trim()) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  try {
    await authProvider.requestPasswordReset(username.trim());
  } catch (err) {
    console.error("[forgot-password]", err);
  }

  // Logged regardless of whether the account exists — also useful for
  // spotting enumeration/brute-force attempts against this endpoint.
  logEvent("PASSWORD_RESET_REQUESTED", { username: username.trim() });

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
