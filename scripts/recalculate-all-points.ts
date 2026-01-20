import { prisma } from "../lib/prisma";
import { calculatePoints } from "../lib/points";
import matchesData from "../data/matches.json";

async function recalculateAllPoints() {
  console.log("🔄 Recalculando todos los puntos...\n");

  let totalUpdated = 0;
  let totalFixed = 0;

  // 1. Recalcular puntos para partidos de knockout (en la BD)
  console.log("📊 Procesando partidos knockout...");
  const knockoutMatches = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
  });

  for (const match of knockoutMatches) {
    const predictions = await prisma.prediction.findMany({
      where: { matchId: match.id },
      include: { user: { select: { name: true } } },
    });

    console.log(
      `\n⚽ Partido ${match.id}: ${match.homeScore}-${match.awayScore}`,
    );

    for (const prediction of predictions) {
      const oldPoints = prediction.points;
      const newPoints = calculatePoints(
        prediction.homeScore,
        prediction.awayScore,
        match.homeScore!,
        match.awayScore!,
      );

      if (oldPoints !== newPoints) {
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { points: newPoints },
        });

        console.log(
          `  ✏️  ${prediction.user.name}: ${prediction.homeScore}-${prediction.awayScore} | ${oldPoints}pts → ${newPoints}pts ✅`,
        );
        totalFixed++;
      }

      totalUpdated++;
    }
  }

  // 2. Recalcular puntos para partidos de grupo (matchesData + GroupMatchScore)
  console.log("\n\n📊 Procesando partidos de grupos...");
  const groupScores = await prisma.groupMatchScore.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
  });

  for (const score of groupScores) {
    const predictionMatchId = `match_${score.matchId}`;
    const match = matchesData.matches.find((m: any) => m.id === score.matchId);

    if (!match) continue;

    const predictions = await prisma.prediction.findMany({
      where: { matchId: predictionMatchId },
      include: { user: { select: { name: true } } },
    });

    console.log(
      `\n⚽ Partido de grupo ${score.matchId}: ${score.homeScore}-${score.awayScore}`,
    );

    for (const prediction of predictions) {
      const oldPoints = prediction.points;
      const newPoints = calculatePoints(
        prediction.homeScore,
        prediction.awayScore,
        score.homeScore!,
        score.awayScore!,
      );

      if (oldPoints !== newPoints) {
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { points: newPoints },
        });

        console.log(
          `  ✏️  ${prediction.user.name}: ${prediction.homeScore}-${prediction.awayScore} | ${oldPoints}pts → ${newPoints}pts ✅`,
        );
        totalFixed++;
      }

      totalUpdated++;
    }
  }

  console.log("\n\n✅ Proceso completado:");
  console.log(`   - Total predicciones revisadas: ${totalUpdated}`);
  console.log(`   - Total predicciones corregidas: ${totalFixed}`);
}

recalculateAllPoints()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
