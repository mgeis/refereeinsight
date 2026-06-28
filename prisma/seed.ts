import "dotenv/config";
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
    await prisma.position.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeded positions.");

  await prisma.user.upsert({
    where: { username: "referee" },
    update: {},
    create: {
      username: "referee",
      password: "referee",
      firstName: "Dev",
      lastName: "User",
    },
  });

  console.log("Seeded default user.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
