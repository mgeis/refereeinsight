import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getCurrentEula, acceptCurrentEula } from "@/lib/eula";
import { logEvent } from "@/lib/events";

// POST /api/eula/accept — records the current user's acceptance of the current EULA version
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const eula = await getCurrentEula();
  await acceptCurrentEula(userId);

  logEvent("EULA_ACCEPTED", { userId, eulaVersion: eula.version });

  return NextResponse.json({ ok: true, version: eula.version });
}
