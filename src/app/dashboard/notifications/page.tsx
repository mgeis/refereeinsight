import { redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { NotificationsList } from "@/components/NotificationsList";

export default async function NotificationsPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  return <NotificationsList />;
}
