import { PrismaClient } from "@prisma/client";
import { ensureDemoData } from "../lib/demo";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../lib/demo-constants";

const prisma = new PrismaClient();

async function main() {
  await ensureDemoData(prisma);
  console.log(
    `\nSeed complete.\n  Login: ${DEMO_EMAIL}\n  Password: ${DEMO_PASSWORD}\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
