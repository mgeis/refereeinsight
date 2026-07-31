import { getPrisma } from "@/lib/db";

export async function getUserRoles(userId: number): Promise<string[]> {
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
  return user?.roles.map(r => r.name) ?? [];
}

export async function userHasRole(userId: number, role: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}
