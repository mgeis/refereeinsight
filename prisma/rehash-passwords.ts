import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, password: true } });

  for (const user of users) {
    // Skip already-hashed passwords (bcrypt hashes start with $2b$ or $2a$)
    if (user.password.startsWith("$2")) {
      console.log(`  [skip] ${user.username} — already hashed`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    console.log(`  [ok]   ${user.username} — rehashed`);
  }

  console.log("Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
