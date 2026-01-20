/**
 * Script para testear el sistema de puntos con varios jugadores
 */
import { PrismaClient } from "@prisma/client";
import { calculatePoints } from "../lib/points";

const prisma = new PrismaClient();

async function testScoringSystem() {
  console.log("🧪 Iniciando pruebas del sistema de puntos...\n");

  // 1. Obtener usuarios de prueba
  const users = await prisma.user.findMany({
    take: 5,
    include: {
      predictions: true,
    },
  });

  console.log(`👥 Usuarios en el sistema: ${users.length}\n`);

  // 2. Obtener partidos con resultados (desde Match o GroupMatchScore)
  const dbMatches = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    take: 5,
  });

  const groupMatchScores = await prisma.groupMatchScore.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
    take: 5,
  });

  console.log(`⚽ Partidos en DB con resultados: ${dbMatches.length}`);
  console.log(
    `⚽ Partidos de grupo con resultados: ${groupMatchScores.length}\n`,
  );

  if (dbMatches.length === 0 && groupMatchScores.length === 0) {
    console.log("⚠️  No hay partidos con resultados registrados");
    console.log(
      "💡 Sugerencia: Agrega resultados a algunos partidos desde el panel de admin\n",
    );
  } else {
    // 3. Calcular puntos para cada partido de DB
    for (const match of dbMatches) {
      console.log(
        `\n📊 Partido: ${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}`,
      );
      console.log(
        `📅 Fecha: ${match.matchDate.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`,
      );
      console.log(`📍 ${match.stadium}, ${match.city}\n`);

      // Buscar predicciones para este partido
      const predictions = await prisma.prediction.findMany({
        where: { matchId: match.id },
        include: { user: true },
      });

      if (predictions.length === 0) {
        console.log("  ℹ️  Sin predicciones para este partido\n");
        continue;
      }

      console.log("  Predicciones y puntos:");
      for (const prediction of predictions) {
        const points = calculatePoints(
          prediction.homeScore,
          prediction.awayScore,
          match.homeScore!,
          match.awayScore!,
        );

        console.log(
          `  👤 ${prediction.user.name}: ${prediction.homeScore}-${prediction.awayScore} → ${points} puntos ${points !== prediction.points ? `(guardado: ${prediction.points})` : "✓"}`,
        );
      }
    }

    // También mostrar partidos de grupo
    for (const score of groupMatchScores) {
      console.log(
        `\n📊 Partido de grupo #${score.matchId}: ${score.homeScore} - ${score.awayScore}`,
      );

      const predictions = await prisma.prediction.findMany({
        where: { matchId: String(score.matchId) },
        include: { user: true },
      });

      if (predictions.length > 0) {
        console.log("  Predicciones y puntos:");
        for (const prediction of predictions) {
          const points = calculatePoints(
            prediction.homeScore,
            prediction.awayScore,
            score.homeScore!,
            score.awayScore!,
          );

          console.log(
            `  👤 ${prediction.user.name}: ${prediction.homeScore}-${prediction.awayScore} → ${points} puntos ${points !== prediction.points ? `(guardado: ${prediction.points})` : "✓"}`,
          );
        }
      }
    }
  }

  // 4. Calcular tabla de posiciones
  console.log("\n\n🏆 TABLA DE POSICIONES\n");
  console.log("═".repeat(60));

  const leaderboard = await prisma.prediction.groupBy({
    by: ["userId"],
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
  });

  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const user = await prisma.user.findUnique({
      where: { id: entry.userId },
    });

    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
    console.log(
      `${medal} ${i + 1}. ${user?.name?.padEnd(30)} ${entry._sum.points || 0} puntos`,
    );
  }

  // 5. Verificar horarios
  console.log("\n\n⏰ VERIFICACIÓN DE HORARIOS (México)\n");
  console.log("═".repeat(60));

  const upcomingMatches = await prisma.match.findMany({
    where: {
      matchDate: {
        gte: new Date(),
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      matchDate: "asc",
    },
    take: 10,
  });

  if (upcomingMatches.length === 0) {
    console.log("ℹ️  No hay partidos próximos programados\n");
  } else {
    for (const match of upcomingMatches) {
      const mexDate = match.matchDate.toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        dateStyle: "full",
        timeStyle: "short",
      });

      console.log(`\n📅 ${mexDate}`);
      console.log(`   ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      console.log(`   📍 ${match.stadium}, ${match.city}`);
    }
  }

  console.log("\n\n✅ Pruebas completadas\n");
}

testScoringSystem()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
