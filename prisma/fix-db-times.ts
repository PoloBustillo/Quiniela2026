// Script para corregir horarios en la base de datos
// Resta 2 horas a todos los partidos de knockout

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🔧 Corrigiendo horarios en la base de datos (restando 2 horas)..."
  );

  // Obtener todos los partidos
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      matchDate: true,
      phase: true,
    },
  });

  console.log(`Total de partidos en DB: ${matches.length}`);

  let corrected = 0;

  for (const match of matches) {
    const oldDate = new Date(match.matchDate);
    const newDate = new Date(oldDate);

    // Restar 2 horas
    newDate.setHours(newDate.getHours() - 2);

    // Actualizar en la base de datos
    await prisma.match.update({
      where: { id: match.id },
      data: { matchDate: newDate },
    });

    console.log(
      `✓ Partido ${match.id} (${
        match.phase
      }): ${oldDate.toISOString()} → ${newDate.toISOString()}`
    );
    corrected++;
  }

  console.log(`\n✅ Corregidos ${corrected} horarios en la base de datos`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
