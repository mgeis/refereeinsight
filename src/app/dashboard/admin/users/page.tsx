import { notFound, redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { AdminUsersTable } from "@/components/AdminUsersTable";

export default async function AdminUsersPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) notFound();

  return <AdminUsersTable />;
}
