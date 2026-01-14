import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Agregando equipo TBD (Por Definir)...");

  const tbdTeam = await prisma.team.upsert({
    where: { code: "TBD" },
    update: {},
    create: {
      name: "Por Definir",
      code: "TBD",
      flag: "/flags/tbd.png",
      group: null,
    },
  });

  console.log("✓ Equipo TBD creado:", tbdTeam);

  console.log("\n✓ Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
