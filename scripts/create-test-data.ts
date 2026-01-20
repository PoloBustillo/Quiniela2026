/**
 * Script para crear datos de prueba para testear el sistema
 */
import { PrismaClient } from "@prisma/client";
import { calculatePoints } from "../lib/points";

const prisma = new PrismaClient();

async function createTestData() {
  console.log("🎲 Creando datos de prueba...\n");

  // 1. Crear usuarios de prueba
  const testUsers = [
    { name: "Juan Pérez", email: "juan@test.com" },
    { name: "María García", email: "maria@test.com" },
    { name: "Carlos López", email: "carlos@test.com" },
    { name: "Ana Martínez", email: "ana@test.com" },
    { name: "Luis Rodríguez", email: "luis@test.com" },
  ];

  console.log("👥 Creando usuarios...");
  const createdUsers = [];
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
    console.log(`   ✓ ${user.name}`);
  }

  // 2. Obtener partidos con resultados para crear predicciones
  const matchesWithScores = await prisma.groupMatchScore.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
  });

  console.log(`\n⚽ Partidos con resultados: ${matchesWithScores.length}`);

  if (matchesWithScores.length > 0) {
    console.log("\n📝 Creando predicciones para cada usuario...");

    for (const match of matchesWithScores) {
      console.log(`\n   Partido #${match.matchId}: ${match.homeScore} - ${match.awayScore}`);

      for (const user of createdUsers) {
        // Crear predicciones variadas para testear diferentes escenarios
        let homeScore: number, awayScore: number;

        const scenario = Math.floor(Math.random() * 4);
        switch (scenario) {
          case 0: // Predicción exacta
            homeScore = match.homeScore!;
            awayScore = match.awayScore!;
            break;
          case 1: // Ganador correcto pero diferente marcador
            if (match.homeScore! > match.awayScore!) {
              homeScore = match.homeScore! + 1;
              awayScore = match.awayScore!;
            } else if (match.awayScore! > match.homeScore!) {
              homeScore = match.homeScore!;
              awayScore = match.awayScore! + 1;
            } else {
              homeScore = match.homeScore!;
              awayScore = match.awayScore!;
            }
            break;
          case 2: // Ganador incorrecto
            homeScore = match.awayScore!;
            awayScore = match.homeScore!;
            break;
          default: // Random
            homeScore = Math.floor(Math.random() * 4);
            awayScore = Math.floor(Math.random() * 4);
        }

        const points = calculatePoints(
          homeScore,
          awayScore,
          match.homeScore!,
          match.awayScore!
        );

        const prediction = await prisma.prediction.upsert({
          where: {
            userId_matchId: {
              userId: user.id,
              matchId: String(match.matchId),
            },
          },
          update: {
            homeScore,
            awayScore,
            points,
          },
          create: {
            userId: user.id,
            matchId: String(match.matchId),
            homeScore,
            awayScore,
            points,
            phase: "GROUP_STAGE",
          },
        });

        console.log(
          `      ${user.name}: ${prediction.homeScore}-${prediction.awayScore} = ${prediction.points} puntos`
        );
      }
    }
  }

  // 3. Crear algunas predicciones para partidos futuros (sin puntos)
  console.log("\n\n📅 Creando predicciones para partidos futuros...");
  const futureMatchIds = [3, 4, 5]; // IDs de partidos que aún no tienen resultado

  for (const matchId of futureMatchIds) {
    console.log(`\n   Partido #${matchId} (sin resultado aún):`);
    
    for (const user of createdUsers) {
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);

      await prisma.prediction.upsert({
        where: {
          userId_matchId: {
            userId: user.id,
            matchId: String(matchId),
          },
        },
        update: {
          homeScore,
          awayScore,
        },
        create: {
          userId: user.id,
          matchId: String(matchId),
          homeScore,
          awayScore,
          points: 0,
          phase: "GROUP_STAGE",
        },
      });

      console.log(`      ${user.name}: ${homeScore}-${awayScore}`);
    }
  }

  console.log("\n\n✅ Datos de prueba creados exitosamente!");
  console.log("\n💡 Ahora puedes:");
  console.log("   1. Ejecutar: npx tsx scripts/test-scoring-system.ts");
  console.log("   2. Iniciar la app: npm run dev");
  console.log("   3. Ver la tabla de posiciones en: http://localhost:3000/leaderboard");
}

createTestData()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
