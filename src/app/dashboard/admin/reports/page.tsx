import { notFound, redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { AdminReportsTable } from "@/components/AdminReportsTable";

export default async function AdminReportsPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) notFound();

  return <AdminReportsTable />;
}
