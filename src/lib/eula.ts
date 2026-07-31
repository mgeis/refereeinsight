import { getPrisma } from "@/lib/db";

export async function getCurrentEula() {
  const prisma = await getPrisma();
  return prisma.eula.findFirstOrThrow({ orderBy: { version: "desc" } });
}

export async function hasAcceptedCurrentEula(userId: number): Promise<boolean> {
  const prisma = await getPrisma();
  const current = await prisma.eula.findFirst({ orderBy: { version: "desc" } });
  if (!current) return true; // no EULA configured — nothing to gate on

  const acceptance = await prisma.eulaAcceptance.findUnique({
    where: { userId_eulaId: { userId, eulaId: current.id } },
  });
  return !!acceptance;
}

export async function acceptCurrentEula(userId: number): Promise<void> {
  const current = await getCurrentEula();
  const prisma = await getPrisma();
  await prisma.eulaAcceptance.upsert({
    where: { userId_eulaId: { userId, eulaId: current.id } },
    update: {},
    create: { userId, eulaId: current.id },
  });
}
