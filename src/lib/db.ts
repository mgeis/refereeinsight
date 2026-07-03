import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getConnectionString } from "./db-config";

type PrismaClientSingleton = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prismaPromise: Promise<PrismaClientSingleton> | undefined;
};

async function createClient(): Promise<PrismaClientSingleton> {
  const connectionString = await getConnectionString();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma(): Promise<PrismaClientSingleton> {
  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createClient();
  }
  return globalForPrisma.prismaPromise;
}
