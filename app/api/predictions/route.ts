import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { matchId, homeScore, awayScore } = body;

    if (
      typeof matchId !== "number" ||
      typeof homeScore !== "number" ||
      typeof awayScore !== "number"
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Convert matchId to string for database storage
    const matchIdStr = `match_${matchId}`;

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId: matchIdStr,
        },
      },
      update: {
        homeScore,
        awayScore,
      },
      create: {
        userId: session.user.id,
        matchId: matchIdStr,
        homeScore,
        awayScore,
      },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error saving prediction:", error);
    return NextResponse.json(
      { error: "Error al guardar la predicción" },
      { status: 500 }
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
      { status: 500 }
    );
  }
}
