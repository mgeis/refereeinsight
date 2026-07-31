import { notFound, redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { AdminInvitesTable } from "@/components/AdminInvitesTable";

export default async function AdminInvitesPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) notFound();

  return <AdminInvitesTable />;
}
