import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { authProvider, SESSION_COOKIE } from "@/lib/auth/index";

export { SESSION_COOKIE };

export async function getSessionUserId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return authProvider.resolveSession(token);
}

// For Server Components, which don't receive a NextRequest and instead read
// cookies via next/headers.
export async function getSessionUserIdFromCookies(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return authProvider.resolveSession(token);
}
