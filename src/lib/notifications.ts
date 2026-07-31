import { userHasRole } from "@/lib/roles";

export type NotificationScope = "personal" | "admin";

// Shared by the notifications list/unread-count/read-all routes — personal
// and admin notifications are intentionally separate inboxes (a user can
// hold both REFEREE and ADMINISTRATOR roles at once) so every read of this
// data is scoped one way or the other, never both.
export async function resolveScope(
  userId: number,
  sp: URLSearchParams,
): Promise<{ scope: NotificationScope } | { error: string; status: number }> {
  const scope: NotificationScope = sp.get("scope") === "admin" ? "admin" : "personal";
  if (scope === "admin" && !(await userHasRole(userId, "ADMINISTRATOR"))) {
    return { error: "Forbidden.", status: 403 };
  }
  return { scope };
}
