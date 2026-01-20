import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import matchesData from "@/data/matches.json";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/points";

// GET - Obtener todos los partidos de fase de grupos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener marcadores de la base de datos
    const scores = await prisma.groupMatchScore.findMany();
    const scoresMap = scores.reduce(
      (acc, score) => {
        acc[score.matchId] = {
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          matchDate: score.matchDate, // Fecha personalizada si existe
        };
        return acc;
      },
      {} as Record<
        number,
        {
          homeScore: number | null;
          awayScore: number | null;
          matchDate: Date | null;
        }
      >,
    );

    // Combinar datos del JSON con marcadores de la BD
    const matchesWithScores = matchesData.matches.map((match: any) => {
      const score = scoresMap[match.id];
      let dateToUse = match.date;

      // Si hay una fecha personalizada en BD, convertirla al formato del JSON
      if (score?.matchDate) {
        // Formatear como "YYYY-MM-DD HH:MM:SS-06" (formato México)
        const year = score.matchDate.toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          year: "numeric",
        });
        const month = score.matchDate.toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          month: "2-digit",
        });
        const day = score.matchDate.toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          day: "2-digit",
        });
        const hour = score.matchDate
          .toLocaleString("en-US", {
            timeZone: "America/Mexico_City",
            hour: "2-digit",
            hour12: false,
          })
          .padStart(2, "0");
        const minute = score.matchDate.toLocaleString("en-US", {
          timeZone: "America/Mexico_City",
          minute: "2-digit",
        });

        dateToUse = `${year}-${month}-${day} ${hour}:${minute}:00-06`;
      }

      return {
        ...match,
        date: dateToUse,
        homeScore: score?.homeScore ?? null,
        awayScore: score?.awayScore ?? null,
      };
    });

    return NextResponse.json(matchesWithScores);
  } catch (error) {
    console.error("Error fetching group matches:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar un partido de fase de grupos
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { matchId, homeScore, awayScore, matchDate } = body;

    console.log("🔧 API group-matches recibió:", {
      matchId,
      homeScore,
      awayScore,
      matchDate,
    });

    // Verificar que el partido existe en el JSON
    const match = matchesData.matches.find((m: any) => m.id === matchId);

    if (!match) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 },
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (homeScore !== undefined) updateData.homeScore = homeScore;
    if (awayScore !== undefined) updateData.awayScore = awayScore;
    if (matchDate !== undefined)
      updateData.matchDate = matchDate ? new Date(matchDate) : null;

    const createData: any = {
      matchId: matchId,
      homeScore: homeScore ?? null,
      awayScore: awayScore ?? null,
    };
    if (matchDate !== undefined)
      createData.matchDate = matchDate ? new Date(matchDate) : null;

    // Actualizar o crear el marcador en la base de datos
    const updatedScore = await prisma.groupMatchScore.upsert({
      where: { matchId: matchId },
      update: updateData,
      create: createData,
    });

    console.log("✅ GroupMatchScore actualizado:", updatedScore);

    // Si se actualizaron los marcadores, calcular puntos para todas las predicciones
    if (homeScore !== undefined && awayScore !== undefined) {
      const predictionMatchId = `match_${matchId}`;

      const predictions = await prisma.prediction.findMany({
        where: { matchId: predictionMatchId },
      });

      // Actualizar puntos para cada predicción
      for (const prediction of predictions) {
        const points = calculatePoints(
          prediction.homeScore,
          prediction.awayScore,
          homeScore,
          awayScore,
        );

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { points },
        });
      }

      console.log(
        `✅ Actualizados puntos para ${predictions.length} predicciones del partido de grupos ${matchId}`,
      );
    }

    // Retornar el partido con los datos actualizados
    return NextResponse.json({
      ...match,
      date: updatedScore.matchDate
        ? updatedScore.matchDate.toISOString()
        : match.date,
      homeScore: updatedScore.homeScore,
      awayScore: updatedScore.awayScore,
    });
  } catch (error) {
    console.error("Error updating group match:", error);
    return NextResponse.json(
      { error: "Error al actualizar partido" },
      { status: 500 },
    );
  }
}
