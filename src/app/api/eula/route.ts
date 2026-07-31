import { NextResponse } from "next/server";
import { getCurrentEula } from "@/lib/eula";

// GET /api/eula — public (needed on the signup page, before an account exists)
export async function GET() {
  const eula = await getCurrentEula();
  return NextResponse.json({ version: eula.version, content: eula.content });
}
