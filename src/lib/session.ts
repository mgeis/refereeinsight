import { NextRequest } from "next/server";
import { authProvider, SESSION_COOKIE } from "@/lib/auth/index";

export { SESSION_COOKIE };

export async function getSessionUserId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return authProvider.resolveSession(token);
}
