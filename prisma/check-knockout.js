const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando partidos de eliminatorias...\n");

  const knockoutMatches = await prisma.match.findMany({
    where: {
      phase: {
        not: "GROUP_STAGE",
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      matchDate: "asc",
    },
  });

  if (knockoutMatches.length === 0) {
    console.log("❌ No hay partidos de eliminatorias en la base de datos.");
    console.log(
      "   Usa el panel de administrador en /admin para crear partidos."
    );
  } else {
    console.log(
      `✅ Se encontraron ${knockoutMatches.length} partidos de eliminatorias:\n`
    );

    knockoutMatches.forEach((match, i) => {
      console.log(`${i + 1}. ${match.phase}`);
      console.log(`   ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      console.log(`   Fecha: ${match.matchDate.toLocaleDateString("es-MX")}`);
      console.log(`   Estado: ${match.status}`);
      console.log("");
    });
  }

  // Verificar TBD team
  const tbdTeam = await prisma.team.findUnique({
    where: { code: "TBD" },
  });

  if (tbdTeam) {
    console.log(`✅ Equipo TBD existe: ${tbdTeam.name} (ID: ${tbdTeam.id})`);
  } else {
    console.log("❌ Equipo TBD no existe");
  }

  // Contar todos los equipos
  const totalTeams = await prisma.team.count();
  console.log(`\n📊 Total de equipos en la base de datos: ${totalTeams}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
