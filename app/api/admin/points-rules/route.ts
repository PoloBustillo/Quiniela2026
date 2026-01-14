import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener reglas de puntos activas
export async function GET(request: Request) {
  try {
    const rules = await prisma.pointsRule.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Si no hay reglas, crear las predeterminadas
    if (!rules) {
      const defaultRules = await prisma.pointsRule.create({
        data: {
          exactScore: 5,
          correctWinner: 3,
          correctDraw: 3,
          correctGoalDifference: 2,
          isActive: true,
        },
      });
      return NextResponse.json(defaultRules);
    }

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching points rules:", error);
    return NextResponse.json(
      { error: "Error al obtener reglas de puntos" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar reglas de puntos (solo admin)
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
    const { exactScore, correctWinner, correctDraw, correctGoalDifference } = body;

    // Desactivar reglas anteriores
    await prisma.pointsRule.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Crear nuevas reglas
    const newRules = await prisma.pointsRule.create({
      data: {
        exactScore,
        correctWinner,
        correctDraw,
        correctGoalDifference,
        isActive: true,
      },
    });

    return NextResponse.json(newRules);
  } catch (error) {
    console.error("Error updating points rules:", error);
    return NextResponse.json(
      { error: "Error al actualizar reglas de puntos" },
      { status: 500 }
    );
  }
}
