import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Verificando datos en la base de datos...\n');

  // 1. Ver predicciones
  const predictions = await prisma.prediction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      matchId: true,
      homeScore: true,
      awayScore: true,
      points: true,
      phase: true,
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  console.log('📊 Últimas 10 predicciones:');
  console.table(predictions);

  // 2. Ver marcadores de partidos
  const scores = await prisma.groupMatchScore.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });

  console.log('\n⚽ Últimos marcadores actualizados:');
  console.table(scores);

  // 3. Ver usuarios con predicciones y puntos
  const users = await prisma.user.findMany({
    where: {
      hasPaid: true,
    },
    select: {
      name: true,
      email: true,
      predictions: {
        select: {
          points: true,
        }
      }
    }
  });

  console.log('\n👥 Usuarios con puntos:');
  users.forEach(user => {
    const totalPoints = user.predictions.reduce((sum, p) => sum + p.points, 0);
    console.log(`${user.name}: ${totalPoints} puntos (${user.predictions.length} predicciones)`);
  });

  await prisma.$disconnect();
}

checkData();
