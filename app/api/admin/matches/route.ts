import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/points";

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

    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    console.log(phase);

    const matches = await prisma.match.findMany({
      where: phase ? { phase: phase as any } : {},
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        matchDate: "asc",
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const { homeTeamId, awayTeamId, matchDate, stadium, city, phase } = body;
    const parsedMatchDate = new Date(matchDate);

    if (!matchDate || isNaN(parsedMatchDate.getTime())) {
      return NextResponse.json(
        { error: "Fecha de partido inválida" },
        { status: 400 },
      );
    }

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        matchDate: parsedMatchDate,
        stadium,
        city,
        phase,
        status: "SCHEDULED",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Error al crear partido" },
      { status: 500 },
    );
  }
}

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
    const {
      id,
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      status,
      matchDate,
      stadium,
      city,
      bsdEventId,
    } = body;

    console.log("🔧 API recibió actualización:", {
      id,
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      status,
      matchDate,
      stadium,
      city,
    });

    const parsedMatchDate = matchDate ? new Date(matchDate) : null;
    if (matchDate && (!parsedMatchDate || isNaN(parsedMatchDate.getTime()))) {
      return NextResponse.json(
        { error: "Fecha de partido inválida" },
        { status: 400 },
      );
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status && { status }),
        ...(parsedMatchDate && { matchDate: parsedMatchDate }),
        ...(stadium !== undefined && { stadium }),
        ...(city !== undefined && { city }),
        // bsdEventId: asignar/quitar mapeo BSD para sync automático
        ...(bsdEventId !== undefined && {
          bsdEventId: bsdEventId === null ? null : Number(bsdEventId),
        }),
        // manualOverride: score manual → proteger; nuevo bsdEventId → liberar para BSD; resto → no tocar
        ...(homeScore !== undefined || awayScore !== undefined
          ? { manualOverride: true, syncSource: "manual" }
          : bsdEventId !== undefined && bsdEventId !== null
            ? { manualOverride: false, syncSource: null }
            : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Si se actualizaron los marcadores, calcular puntos para todas las predicciones
    if (homeScore !== undefined && awayScore !== undefined) {
      // Buscar predicciones con ID estable y fallback legacy para compatibilidad.
      const allMatches = await prisma.match.findMany({
        orderBy: { matchDate: "asc" },
      });
      const matchIndex = allMatches.findIndex((m) => m.id === id);
      const stableMatchId = `match_${id}`;
      const legacyMatchId =
        matchIndex >= 0 ? `match_${1000 + matchIndex}` : null;

      const predictionWhere = {
        OR: [
          { matchId: stableMatchId },
          ...(legacyMatchId ? [{ matchId: legacyMatchId }] : []),
        ],
      };

      // Si se borró el score (null), resetear puntos a 0; si hay score, calcular
      const hasValidScore = homeScore !== null && awayScore !== null;

      if (!hasValidScore) {
        const { count } = await prisma.prediction.updateMany({
          where: predictionWhere,
          data: { points: 0 },
        });
        console.log(
          `🔄 Reset puntos a 0 para ${count} predicciones del partido ${id} (score borrado)`,
        );
      } else {
        const activeRules = await prisma.pointsRule.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            exactScore: true,
            correctWinner: true,
            correctDraw: true,
          },
        });

        const predictions = await prisma.prediction.findMany({
          where: predictionWhere,
        });

        // Actualizar puntos para cada predicción
        for (const prediction of predictions) {
          const points = calculatePoints(
            prediction.homeScore,
            prediction.awayScore,
            homeScore,
            awayScore,
            activeRules ?? undefined,
          );

          await prisma.prediction.update({
            where: { id: prediction.id },
            data: { points },
          });
        }

        console.log(
          `✅ Actualizados puntos para ${predictions.length} predicciones del partido ${id}`,
        );
      }
    }

    console.log("✅ Partido actualizado en BD:", {
      id: match.id,
      matchDate: match.matchDate,
      stadium: match.stadium,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Error al actualizar partido" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de partido requerido" },
        { status: 400 },
      );
    }

    await prisma.match.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Partido eliminado" });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Error al eliminar partido" },
      { status: 500 },
    );
  }
}
