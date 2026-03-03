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
        createdAt: true,
        _count: {
          select: {
            predictions: true,
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
    const { userId, hasPaid, phase } = body;

    // Si se especifica una fase, actualizar esa fase específica
    // Si no, actualizar el campo legacy hasPaid
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
      // Legacy: actualizar hasPaid
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
