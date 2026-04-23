import { prisma } from "../lib/prisma";

async function migrateLegacyKnockoutPredictionIds() {
  console.log("🔄 Migrando predicciones legacy de knockout (match_1000+)...");

  const knockoutMatches = await prisma.match.findMany({
    where: {
      phase: {
        not: "GROUP_STAGE",
      },
    },
    select: {
      id: true,
      matchDate: true,
    },
    orderBy: {
      matchDate: "asc",
    },
  });

  const legacyToStable = new Map<string, string>();
  knockoutMatches.forEach((match, index) => {
    legacyToStable.set(`match_${1000 + index}`, `match_${match.id}`);
  });

  const predictions = await prisma.prediction.findMany({
    where: {
      matchId: {
        startsWith: "match_",
      },
    },
    select: {
      id: true,
      userId: true,
      matchId: true,
      homeScore: true,
      awayScore: true,
      points: true,
      phase: true,
      updatedAt: true,
    },
  });

  const candidates = predictions.filter((p) => legacyToStable.has(p.matchId));

  let migrated = 0;
  let merged = 0;
  let untouched = 0;

  for (const legacyPred of candidates) {
    const stableMatchId = legacyToStable.get(legacyPred.matchId);
    if (!stableMatchId) {
      untouched++;
      continue;
    }

    const existingStable = await prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId: legacyPred.userId,
          matchId: stableMatchId,
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    await prisma.$transaction(async (tx) => {
      if (existingStable) {
        // Keep the most recently updated prediction if both rows exist.
        if (legacyPred.updatedAt > existingStable.updatedAt) {
          await tx.prediction.update({
            where: { id: existingStable.id },
            data: {
              homeScore: legacyPred.homeScore,
              awayScore: legacyPred.awayScore,
              points: legacyPred.points,
              phase: legacyPred.phase,
            },
          });
        }

        await tx.prediction.delete({
          where: { id: legacyPred.id },
        });

        merged++;
      } else {
        await tx.prediction.update({
          where: { id: legacyPred.id },
          data: {
            matchId: stableMatchId,
          },
        });

        migrated++;
      }
    });
  }

  console.log("✅ Migración completada:");
  console.log(`   - candidatos detectados: ${candidates.length}`);
  console.log(`   - migrados directos: ${migrated}`);
  console.log(`   - fusionados (conflicto): ${merged}`);
  console.log(`   - sin cambios: ${untouched}`);
}

migrateLegacyKnockoutPredictionIds()
  .catch((error) => {
    console.error("❌ Error durante migración:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
