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

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        matchDate: new Date(matchDate),
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

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status && { status }),
        ...(matchDate && { matchDate: new Date(matchDate) }),
        ...(stadium !== undefined && { stadium }),
        ...(city !== undefined && { city }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Si se actualizaron los marcadores, calcular puntos para todas las predicciones
    if (homeScore !== undefined && awayScore !== undefined) {
      // Obtener todas las predicciones para este partido
      // El matchId en predictions está en formato "match_1000", "match_1001", etc.
      // donde los IDs > 1000 son partidos de knockout en la BD
      // Necesitamos obtener el índice del partido para construir el matchId correcto
      const allMatches = await prisma.match.findMany({
        orderBy: { matchDate: "asc" },
      });
      const matchIndex = allMatches.findIndex((m) => m.id === id);
      const predictionMatchId = `match_${1000 + matchIndex}`;

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
        `✅ Actualizados puntos para ${predictions.length} predicciones del partido ${id}`,
      );
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
