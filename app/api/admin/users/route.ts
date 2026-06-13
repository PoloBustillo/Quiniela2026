import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los usuarios (solo admin)
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        hasPaid: true,
        paidAt: true,
        paidGroupStage: true,
        paidGroupStageAt: true,
        paidKnockout: true,
        paidKnockoutAt: true,
        paidFinals: true,
        paidFinalsAt: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            predictions: true,
          },
        },
        predictions: {
          select: {
            matchId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de pago de usuario (solo admin)
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
    const { userId, hasPaid, phase, action } = body;

    // Acción: toggleActive - Solo permitir si no tiene pagos ni predicciones
    if (action === "toggleActive") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
          paidGroupStage: true,
          paidKnockout: true,
          paidFinals: true,
          _count: { select: { predictions: true } },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 },
        );
      }

      const hasAnyPayment =
        user.paidGroupStage || user.paidKnockout || user.paidFinals;

      // Solo permitir desactivar si no tiene pagos
      if (user.isActive && hasAnyPayment) {
        return NextResponse.json(
          {
            error:
              "No se puede desactivar: el usuario tiene pagos registrados",
          },
          { status: 400 },
        );
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
      });

      return NextResponse.json(updated);
    }

    // Acción original: actualizar pago
    let updateData: any = {};

    if (phase === "groupStage") {
      updateData.paidGroupStage = hasPaid;
      updateData.paidGroupStageAt = hasPaid ? new Date() : null;
    } else if (phase === "knockout") {
      updateData.paidKnockout = hasPaid;
      updateData.paidKnockoutAt = hasPaid ? new Date() : null;
    } else if (phase === "finals") {
      updateData.paidFinals = hasPaid;
      updateData.paidFinalsAt = hasPaid ? new Date() : null;
    } else {
      updateData.hasPaid = hasPaid;
      updateData.paidAt = hasPaid ? new Date() : null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user payment:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de pago" },
      { status: 500 }
    );
  }
}
