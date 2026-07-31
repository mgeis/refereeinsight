import { notFound, redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { NotificationsList } from "@/components/NotificationsList";

export default async function AdminNotificationsPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) notFound();

  return <NotificationsList scope="admin" />;
}
