import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getPrisma } from "@/lib/db";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { hasAcceptedCurrentEula } from "@/lib/eula";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserIdFromCookies();

  let roles: string[] = [];
  if (userId) {
    if (!(await hasAcceptedCurrentEula(userId))) redirect("/accept-eula");

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    roles = user?.roles.map(r => r.name) ?? [];
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#050d1a" }}>
      <Sidebar roles={roles} />
      <main
        className="flex-1 min-w-0 overflow-auto"
        style={{ marginLeft: "240px", paddingTop: "60px" }}
      >
        {children}
      </main>
    </div>
  );
}
