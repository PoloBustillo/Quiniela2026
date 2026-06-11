import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import matchesData from "@/data/matches.json";
import { parseMatchDate, isPredictionClosed } from "@/lib/points";



export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { matchId, homeScore, awayScore } = body;
    let normalizedMatchId =
      typeof matchId === "number"
        ? `match_${matchId}`
        : typeof matchId === "string" && matchId.startsWith("match_")
          ? matchId
          : null;

    if (
      !normalizedMatchId ||
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      homeScore > 20 ||
      awayScore < 0 ||
      awayScore > 20
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const rawMatchId = normalizedMatchId.replace("match_", "");

    // Verificar si el partido ya empezó y obtener la fase
    // SIEMPRE usar tiempo del SERVIDOR — nunca confiar en el cliente
    let matchDate: Date | null = null;
    let matchPhase: string | null = null;

    // Buscar en partidos de fase de grupos (JSON + override de BD)
    if (/^\d+$/.test(rawMatchId)) {
      const numericMatchId = Number(rawMatchId);
      const jsonMatch = matchesData.matches.find(
        (m: any) => m.id === numericMatchId,
      );
      if (jsonMatch) {
        matchPhase = "GROUP_STAGE";

        // Checar si hay fecha personalizada en BD (tiene prioridad)
        const dbOverride = await prisma.groupMatchScore.findUnique({
          where: { matchId: numericMatchId },
          select: { matchDate: true },
        });

        if (dbOverride?.matchDate) {
          matchDate = dbOverride.matchDate;
        } else {
          matchDate = parseMatchDate(jsonMatch.date);
        }
      } else if (numericMatchId >= 1000) {
        // Compatibilidad legacy: knockout por índice sintético (match_1000+)
        const knockoutIndex = numericMatchId - 1000;
        const knockoutMatches = await prisma.match.findMany({
          where: {
            phase: {
              not: "GROUP_STAGE",
            },
          },
          select: {
            id: true,
            matchDate: true,
            phase: true,
          },
          orderBy: {
            matchDate: "asc",
          },
        });

        const legacyKnockout = knockoutMatches[knockoutIndex];
        if (!legacyKnockout) {
          return NextResponse.json(
            { error: "Partido inválido" },
            { status: 400 },
          );
        }

        matchDate = legacyKnockout.matchDate;
        matchPhase = legacyKnockout.phase;

        // Reescribir a ID estable para evitar seguir guardando formato legacy.
        normalizedMatchId = `match_${legacyKnockout.id}`;
      } else {
        return NextResponse.json(
          { error: "Partido inválido" },
          { status: 400 },
        );
      }
    } else {
      // Buscar en partidos de eliminatorias (DB)
      const dbMatch = await prisma.match.findUnique({
        where: { id: rawMatchId },
        select: {
          matchDate: true,
          phase: true,
        },
      });
      if (dbMatch) {
        matchDate = dbMatch.matchDate;
        matchPhase = dbMatch.phase;
      } else {
        return NextResponse.json(
          { error: "Partido inválido" },
          { status: 400 },
        );
      }
    }

    // VALIDACIÓN EN SERVIDOR: Si el partido ya empezó, rechazar la predicción
    // El tiempo es el del servidor — cambiar el reloj local no tiene efecto
    if (!matchDate || isNaN(matchDate.getTime())) {
      return NextResponse.json(
        { error: "Fecha de partido inválida" },
        { status: 400 },
      );
    }

    if (matchDate && isPredictionClosed(matchDate)) {
      return NextResponse.json(
        {
          error:
            "Este partido ya empezó. Las predicciones se cierran al iniciar el partido (hora del servidor).",
        },
        { status: 400 },
      );
    }

    // Payment check removed — all users can now save predictions.
    // Unpaid users are visually distinguished in the leaderboard.

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId: normalizedMatchId,
        },
      },
      update: {
        homeScore,
        awayScore,
        phase: matchPhase,
      },
      create: {
        userId: session.user.id,
        matchId: normalizedMatchId,
        homeScore,
        awayScore,
        phase: matchPhase,
      },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error saving prediction:", error);
    return NextResponse.json(
      { error: "Error al guardar la predicción" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const predictions = await prisma.prediction.findMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Error al obtener las predicciones" },
      { status: 500 },
    );
  }
}
