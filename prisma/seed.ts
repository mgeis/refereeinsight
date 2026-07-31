import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const positions = [
    "Referee",
    "Assistant Referee 1",
    "Assistant Referee 2",
    "4th Official",
  ];

  for (const name of positions) {
    await prisma.position.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("Seeded positions.");

  await prisma.user.upsert({
    where: { username: "referee" },
    update: {},
    create: {
      username:  "referee",
      password:  await bcrypt.hash("referee", 12),
      firstName: "Dev",
      lastName:  "User",
      email:     "mgeis@yahoo.com",
    },
  });
  console.log("Seeded default user.");

  await prisma.user.upsert({
    where: { username: "mgeis" },
    update: {},
    create: {
      username:  "mgeis",
      password:  await bcrypt.hash("mwg94566", 12),
      firstName: "Matt",
      lastName:  "Geis",
      email:     "mattgeis@gmail.com",
      roles:     { connect: { name: "ADMINISTRATOR" } },
    },
  });
  console.log("Seeded admin user.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
