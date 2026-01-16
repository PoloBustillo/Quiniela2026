import { PrismaClient } from '@prisma/client';
import { calculatePoints } from '../lib/points';

const prisma = new PrismaClient();

async function testLeaderboard() {
  console.log('🔍 VERIFICACIÓN DE DATOS DE LEADERBOARD\n');
  console.log('='.repeat(60));

  // 1. Verificar usuarios que han pagado
  const paidUsers = await prisma.user.findMany({
    where: { hasPaid: true },
    include: {
      predictions: {
        select: {
          matchId: true,
          homeScore: true,
          awayScore: true,
          points: true,
          phase: true,
        }
      }
    }
  });

  console.log(`\n👥 USUARIOS QUE HAN PAGADO: ${paidUsers.length}`);
  console.log('-'.repeat(60));

  if (paidUsers.length === 0) {
    console.log('⚠️  No hay usuarios que hayan pagado. Para aparecer en el leaderboard:');
    console.log('   1. Ve al panel de admin en /admin');
    console.log('   2. Marca usuarios como "Pagado"');
    return;
  }

  // 2. Mostrar predicciones por usuario
  for (const user of paidUsers) {
    const totalPoints = user.predictions.reduce((sum, p) => sum + p.points, 0);
    const withPoints = user.predictions.filter(p => p.points > 0).length;
    const withoutPoints = user.predictions.filter(p => p.points === 0).length;

    console.log(`\n📊 ${user.name || user.email}`);
    console.log(`   Total de predicciones: ${user.predictions.length}`);
    console.log(`   Con puntos (acertadas): ${withPoints}`);
    console.log(`   Sin puntos (falladas o pendientes): ${withoutPoints}`);
    console.log(`   Puntos totales: ${totalPoints}`);

    if (user.predictions.length > 0) {
      console.log(`\n   Últimas 5 predicciones:`);
      user.predictions.slice(0, 5).forEach(p => {
        const matchNum = p.matchId.replace('match_', '#');
        console.log(`   ${matchNum}: ${p.homeScore}-${p.awayScore} = ${p.points} pts`);
      });
    }
  }

  // 3. Verificar marcadores de partidos
  console.log('\n\n⚽ MARCADORES DE PARTIDOS CONFIGURADOS');
  console.log('-'.repeat(60));

  const scores = await prisma.groupMatchScore.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  if (scores.length === 0) {
    console.log('⚠️  No hay marcadores configurados aún.');
    console.log('   Para configurar marcadores:');
    console.log('   1. Ve al panel de admin en /admin');
    console.log('   2. Ingresa los marcadores de los partidos');
    console.log('   3. Los puntos se calcularán automáticamente');
  } else {
    console.log(`\nÚltimos ${scores.length} partidos con marcadores:\n`);
    scores.forEach(s => {
      const score = s.homeScore !== null && s.awayScore !== null
        ? `${s.homeScore}-${s.awayScore}`
        : 'Sin marcador';
      console.log(`   Partido #${s.matchId}: ${score}`);
    });
  }

  // 4. Verificar si hay predicciones sin puntos calculados
  console.log('\n\n🔍 VERIFICACIÓN DE PUNTOS');
  console.log('-'.repeat(60));

  const allPredictions = await prisma.prediction.findMany({
    select: {
      matchId: true,
      homeScore: true,
      awayScore: true,
      points: true,
    }
  });

  // Obtener todos los marcadores
  const allScores = await prisma.groupMatchScore.findMany();
  const scoresMap = new Map(
    allScores.map(s => [
      `match_${s.matchId}`,
      { homeScore: s.homeScore, awayScore: s.awayScore }
    ])
  );

  // Verificar predicciones que deberían tener puntos pero no los tienen
  let needsUpdate = 0;
  const updates: any[] = [];

  for (const pred of allPredictions) {
    const actualScore = scoresMap.get(pred.matchId);
    
    if (actualScore && actualScore.homeScore !== null && actualScore.awayScore !== null) {
      const calculatedPoints = calculatePoints(
        pred.homeScore,
        pred.awayScore,
        actualScore.homeScore,
        actualScore.awayScore
      );

      if (pred.points !== calculatedPoints) {
        needsUpdate++;
        updates.push({
          matchId: pred.matchId,
          predicted: `${pred.homeScore}-${pred.awayScore}`,
          actual: `${actualScore.homeScore}-${actualScore.awayScore}`,
          currentPoints: pred.points,
          shouldBe: calculatedPoints
        });
      }
    }
  }

  if (needsUpdate > 0) {
    console.log(`\n⚠️  PROBLEMA DETECTADO: ${needsUpdate} predicciones con puntos incorrectos`);
    console.log('\nEjemplos:');
    updates.slice(0, 5).forEach(u => {
      console.log(`   ${u.matchId}:`);
      console.log(`     Predicho: ${u.predicted}, Real: ${u.actual}`);
      console.log(`     Puntos actuales: ${u.currentPoints}, Deberían ser: ${u.shouldBe}`);
    });
    console.log('\n💡 Solución: Vuelve a guardar los marcadores desde el panel de admin');
    console.log('   Esto recalculará automáticamente todos los puntos.');
  } else {
    console.log('✅ Todos los puntos están calculados correctamente');
  }

  // 5. Simulación de cómo se vería en el leaderboard
  console.log('\n\n📋 SIMULACIÓN DE LEADERBOARD');
  console.log('='.repeat(60));

  const leaderboard = paidUsers
    .map(user => ({
      name: user.name || user.email || 'Usuario',
      totalPoints: user.predictions.reduce((sum, p) => sum + p.points, 0),
      predictionsCount: user.predictions.length,
      scoredCount: user.predictions.filter(p => p.points > 0).length,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  console.log('\n Pos | Participante              | Pts | Pred | Aciertos');
  console.log('-'.repeat(60));
  leaderboard.forEach((user, idx) => {
    const pos = (idx + 1).toString().padStart(3);
    const name = user.name.padEnd(25);
    const pts = user.totalPoints.toString().padStart(3);
    const pred = user.predictionsCount.toString().padStart(4);
    const scored = user.scoredCount.toString().padStart(8);
    console.log(` ${pos} | ${name} | ${pts} | ${pred} | ${scored}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verificación completada\n');

  await prisma.$disconnect();
}

testLeaderboard().catch(console.error);
