const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Traducciones de nombres de países
const translations = {
  Mexico: "México",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  "Winner UEFA Playoff D": "Ganador Playoff UEFA D",
  Canada: "Canadá",
  "Winner UEFA Playoff A": "Ganador Playoff UEFA A",
  Qatar: "Catar",
  Switzerland: "Suiza",
  Brazil: "Brasil",
  Morocco: "Marruecos",
  Haiti: "Haití",
  Scotland: "Escocia",
  USA: "Estados Unidos",
  Paraguay: "Paraguay",
  Australia: "Australia",
  "Winner UEFA Playoff C": "Ganador Playoff UEFA C",
  Germany: "Alemania",
  Curaçao: "Curazao",
  "Côte d'Ivoire": "Costa de Marfil",
  Ecuador: "Ecuador",
  Netherlands: "Países Bajos",
  Japan: "Japón",
  "Winner UEFA Playoff B": "Ganador Playoff UEFA B",
  Tunisia: "Túnez",
  Belgium: "Bélgica",
  Egypt: "Egipto",
  "IR Iran": "Irán",
  "New Zealand": "Nueva Zelanda",
  Spain: "España",
  "Cabo Verde": "Cabo Verde",
  "Saudi Arabia": "Arabia Saudita",
  Uruguay: "Uruguay",
  France: "Francia",
  Senegal: "Senegal",
  "Winner FIFA Playoff 2": "Ganador Playoff FIFA 2",
  Norway: "Noruega",
  Argentina: "Argentina",
  Algeria: "Argelia",
  Austria: "Austria",
  Jordan: "Jordania",
  Portugal: "Portugal",
  "Winner FIFA Playoff 1": "Ganador Playoff FIFA 1",
  Uzbekistan: "Uzbekistán",
  Colombia: "Colombia",
  England: "Inglaterra",
  Croatia: "Croacia",
  Ghana: "Ghana",
  Panama: "Panamá",
  Chile: "Chile",
  Cameroon: "Camerún",
  Jamaica: "Jamaica",
  Honduras: "Honduras",
  "Costa Rica": "Costa Rica",
  Denmark: "Dinamarca",
  Nigeria: "Nigeria",
  Serbia: "Serbia",
  Poland: "Polonia",
  Italy: "Italia",
  Ukraine: "Ucrania",
  Wales: "Gales",
  Peru: "Perú",
  Iceland: "Islandia",
  Sweden: "Suecia",
  "Por Definir": "Por Definir",
};

async function main() {
  console.log("🌍 Traduciendo nombres de equipos a español...\n");

  const teams = await prisma.team.findMany();
  let updated = 0;
  let skipped = 0;

  for (const team of teams) {
    const spanishName = translations[team.name];

    if (spanishName && spanishName !== team.name) {
      await prisma.team.update({
        where: { id: team.id },
        data: { name: spanishName },
      });
      console.log(`✅ ${team.name} → ${spanishName}`);
      updated++;
    } else {
      console.log(`⏭️  ${team.name} (sin cambios)`);
      skipped++;
    }
  }

  console.log("\n📊 Resumen:");
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ⏭️  Sin cambios: ${skipped}`);
  console.log(`   📦 Total: ${teams.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
