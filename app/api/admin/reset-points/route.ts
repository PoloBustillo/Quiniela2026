import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/reset-points
 * Resetea TODOS los puntos de predicciones a 0.
 * Útil cuando se borraron scores de prueba antes del inicio del torneo.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { count } = await prisma.prediction.updateMany({
      data: { points: 0 },
    });

    console.log(`🔄 Reset de puntos completado: ${count} predicciones → 0 pts`);

    return NextResponse.json({
      success: true,
      message: `Reset completado: ${count} predicciones reseteadas a 0 puntos`,
      count,
    });
  } catch (error) {
    console.error("Error resetting points:", error);
    return NextResponse.json(
      { error: "Error al resetear puntos" },
      { status: 500 },
    );
  }
}
