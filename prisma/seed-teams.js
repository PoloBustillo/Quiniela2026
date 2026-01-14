const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Importando equipos desde teams.json...");

  // Read teams.json
  const teamsFilePath = path.join(__dirname, "..", "data", "teams.json");
  const teamsData = JSON.parse(fs.readFileSync(teamsFilePath, "utf-8"));

  let created = 0;
  let skipped = 0;

  for (const team of teamsData.teams) {
    try {
      // Check if team already exists
      const existing = await prisma.team.findUnique({
        where: { code: team.code },
      });

      if (existing) {
        console.log(`⏭️  Equipo ${team.code} ya existe, saltando...`);
        skipped++;
        continue;
      }

      // Create team
      await prisma.team.create({
        data: {
          name: team.name,
          code: team.code,
          flag: team.flag,
          group: team.group || null,
        },
      });

      console.log(`✅ Creado: ${team.name} (${team.code})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creando ${team.code}:`, error.message);
    }
  }

  console.log("\n📊 Resumen:");
  console.log(`   ✅ Creados: ${created}`);
  console.log(`   ⏭️  Saltados: ${skipped}`);
  console.log(`   📦 Total en JSON: ${teamsData.teams.length}`);

  // Show all teams in database
  const allTeams = await prisma.team.findMany({
    orderBy: { name: "asc" },
  });
  console.log(`\n🗄️  Total en base de datos: ${allTeams.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
