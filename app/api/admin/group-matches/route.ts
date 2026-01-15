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
    const scoresMap = scores.reduce((acc, score) => {
      acc[score.matchId] = {
        homeScore: score.homeScore,
        awayScore: score.awayScore,
      };
      return acc;
    }, {} as Record<number, { homeScore: number | null; awayScore: number | null }>);

    // Combinar datos del JSON con marcadores de la BD
    const matchesWithScores = matchesData.matches.map((match: any) => ({
      ...match,
      homeScore: scoresMap[match.id]?.homeScore ?? null,
      awayScore: scoresMap[match.id]?.awayScore ?? null,
    }));

    return NextResponse.json(matchesWithScores);
  } catch (error) {
    console.error("Error fetching group matches:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
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

    // Verificar que el partido existe en el JSON
    const match = matchesData.matches.find((m: any) => m.id === matchId);

    if (!match) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar o crear el marcador en la base de datos
    const updatedScore = await prisma.groupMatchScore.upsert({
      where: { matchId: matchId },
      update: {
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
      },
      create: {
        matchId: matchId,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
      },
    });

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
          awayScore
        );

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { points },
        });
      }

      console.log(
        `✅ Actualizados puntos para ${predictions.length} predicciones del partido de grupos ${matchId}`
      );
    }

    // Nota: matchDate no se puede actualizar en el JSON en producción
    // Se mantiene solo en desarrollo local si es necesario

    return NextResponse.json({
      ...match,
      homeScore: updatedScore.homeScore,
      awayScore: updatedScore.awayScore,
    });
  } catch (error) {
    console.error("Error updating group match:", error);
    return NextResponse.json(
      { error: "Error al actualizar partido" },
      { status: 500 }
    );
  }
}
